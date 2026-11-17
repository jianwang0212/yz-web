"""CloudMonitor RPC over HTTPS using only the ECS instance's short-lived role."""
import datetime as dt
import hashlib
import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
import uuid

METADATA = 'http://100.100.100.200/latest/'


class CloudError(Exception):
    """A safe error code, never a credential or signed request body."""


def read_json(url, *, method='GET', headers=None, body=None, timeout=45):
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.load(res)
    except urllib.error.HTTPError as error:
        try:
            code = json.loads(error.read()).get('Code', 'HTTP_' + str(error.code))
        except (ValueError, AttributeError):
            code = 'HTTP_' + str(error.code)
        raise CloudError(str(code)[:100]) from None
    except TimeoutError:
        raise CloudError('API_TIMEOUT') from None
    except urllib.error.URLError as error:
        raise CloudError('NETWORK_' + type(error.reason).__name__) from None
    except ValueError:
        raise CloudError('API_INVALID_JSON') from None


def role_credentials(role):
    """Use IMDSv2 only; credentials stay in process memory, never on disk."""
    req = urllib.request.Request(METADATA + 'api/token', method='PUT',
                                headers={'X-aliyun-ecs-metadata-token-ttl-seconds': '300'})
    try:
        with urllib.request.urlopen(req, timeout=3) as res:
            token = res.read().decode()
    except (urllib.error.URLError, TimeoutError):
        raise CloudError('IMDS_TOKEN_UNAVAILABLE') from None
    credentials = read_json(METADATA + 'meta-data/ram/security-credentials/' +
                            urllib.parse.quote(role, safe=''),
                            headers={'X-aliyun-ecs-metadata-token': token}, timeout=3)
    required = ['AccessKeyId', 'AccessKeySecret', 'SecurityToken', 'Expiration']
    if credentials.get('Code') != 'Success' or not all(credentials.get(k) for k in required):
        raise CloudError('INSTANCE_ROLE_CREDENTIALS_UNAVAILABLE')
    expiry = dt.datetime.fromisoformat(credentials['Expiration'].replace('Z', '+00:00'))
    if expiry.timestamp() < dt.datetime.now(dt.timezone.utc).timestamp() + 60:
        raise CloudError('INSTANCE_ROLE_CREDENTIALS_EXPIRING')
    return credentials


def sign_v3(endpoint, action, params, credentials, *, version='2019-01-01', now=None, nonce=None):
    """ACS3-HMAC-SHA256; STS token is signed in a header, never the URL."""
    encode = lambda value: urllib.parse.quote(str(value), safe='~')
    query = '&'.join(encode(k) + '=' + encode(params[k]) for k in sorted(params))
    now = now or dt.datetime.now(dt.timezone.utc)
    payload_hash = hashlib.sha256(b'').hexdigest()
    headers = {'host': endpoint, 'x-acs-action': action, 'x-acs-version': version,
               'x-acs-date': now.strftime('%Y-%m-%dT%H:%M:%SZ'),
               'x-acs-signature-nonce': nonce or str(uuid.uuid4()),
               'x-acs-content-sha256': payload_hash}
    if credentials.get('SecurityToken'):
        headers['x-acs-security-token'] = credentials['SecurityToken']
    signed = ';'.join(sorted(headers))
    canonical_headers = ''.join(k + ':' + str(headers[k]).strip() + '\n' for k in sorted(headers))
    canonical = '\n'.join(['POST', '/', query, canonical_headers, signed, payload_hash])
    to_sign = 'ACS3-HMAC-SHA256\n' + hashlib.sha256(canonical.encode()).hexdigest()
    signature = hmac.new(credentials['AccessKeySecret'].encode(), to_sign.encode(), hashlib.sha256).hexdigest()
    headers['Authorization'] = ('ACS3-HMAC-SHA256 Credential=' + credentials['AccessKeyId'] +
                                ',SignedHeaders=' + signed + ',Signature=' + signature)
    headers['accept'] = 'application/json'
    return 'https://' + endpoint + '/?' + query, headers


def query_cpu(credentials, endpoint, instances, start, end, period=3600):
    if endpoint != 'metrics.cn-hangzhou.aliyuncs.com':
        raise CloudError('UNAPPROVED_ENDPOINT')
    base = {'Action': 'DescribeMetricList', 'Namespace': 'acs_ecs_dashboard',
            'MetricName': 'CPUUtilization', 'Period': str(period), 'Length': '1440',
            'StartTime': str(start * 1000), 'EndTime': str(end * 1000),
            'Dimensions': json.dumps([{'instanceId': x} for x in instances], separators=(',', ':'))}
    points, request_ids, seen = [], [], set()
    for _ in range(12):
        params = {k: v for k, v in base.items() if k != 'Action'}
        params['Format'] = 'JSON'
        url, headers = sign_v3(endpoint, base['Action'], params, credentials)
        response = read_json(url, method='POST', headers=headers)
        if not response.get('Success') or str(response.get('Code')) != '200':
            raise CloudError(str(response.get('Code', 'API_FAILURE'))[:100])
        if int(response.get('Period', period)) != period:
            raise CloudError('UNEXPECTED_AGGREGATION_PERIOD')
        batch = response.get('Datapoints', '[]')
        try:
            batch = json.loads(batch) if isinstance(batch, str) else batch
        except ValueError:
            raise CloudError('INVALID_DATAPOINTS') from None
        if not isinstance(batch, list):
            raise CloudError('INVALID_DATAPOINTS')
        points.extend(batch)
        request_ids.append(response.get('RequestId'))
        token = response.get('NextToken')
        if not token:
            return points, request_ids
        if token in seen:
            raise CloudError('REPEATED_PAGE_TOKEN')
        seen.add(token)
        base['NextToken'] = token
    raise CloudError('TOO_MANY_PAGES')
