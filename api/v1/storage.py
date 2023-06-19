from hurry.filesize import size
from flask import request

from tools import MinioClient, MinioClientAdmin, api_tools, auth

CARRIER_MINIO_INTEGRATION_ID = 1


class ProjectAPI(api_tools.APIModeHandler):
    @auth.decorators.check_api(["configuration.artifacts.artifacts.view"])
    def get(self, project_id: int):
        project = self.module.context.rpc_manager.call.project_get_or_404(project_id=project_id)
        integration_id = request.args.get('integration_id')
        is_local = request.args.get('is_local', '').lower() == 'true'
        c = MinioClient(project, integration_id, is_local)
        buckets = c.list_bucket()
        bucket_types = {}
        total_size = 0
        for bucket in buckets:
            bucket_size = c.get_bucket_size(bucket)
            total_size += bucket_size
            response = c.get_bucket_tags(bucket)
            tags = {tag['Key']: tag['Value'] for tag in response['TagSet']} if response else {}
            if tags.get('type'):
                bucket_types[tags['type']] = bucket_types.get(tags['type'], 0) + bucket_size
        storage_space_quota, free_space = self._get_space_quota(
            project_id, total_size, integration_id, is_local)
        return {
            "total_bucket_size": {
                'readable': size(total_size), 
                'bytes': total_size
                },
            "system_bucket_size": {
                'readable': size(bucket_types.get("system", 0)), 
                'bytes': bucket_types.get("system", 0)
                },
            "autogenerated_bucket_size": {
                'readable': size(bucket_types.get("autogenerated", 0)), 
                'bytes': bucket_types.get("autogenerated", 0)
                },
            "local_bucket_size": {
                'readable': size(bucket_types.get("local", 0)), 
                'bytes': bucket_types.get("local", 0)
                },
            "storage_space_quota": {
                'readable': size(storage_space_quota), 
                'bytes': storage_space_quota
                },
            "free_space": {
                'readable': size(free_space), 
                'bytes': free_space
                },
            }, 200

    def _get_space_quota(self, project_id, total_size, integration_id, is_local):
        if integration_id and int(integration_id) == CARRIER_MINIO_INTEGRATION_ID and is_local != True:
            storage_space_quota = self.module.context.rpc_manager.call.project_get_storage_space_quota(
                project_id=project_id
                )
            return storage_space_quota, storage_space_quota - total_size
        elif integration_id:
            return 0, 0
        else:
            default_integration = self.module.context.rpc_manager.call.integrations_get_defaults(
                project_id=project_id, name='s3_integration'
            )
            if (default_integration.integration_id == CARRIER_MINIO_INTEGRATION_ID and 
                default_integration.project_id == None):
                storage_space_quota = self.module.context.rpc_manager.call.project_get_storage_space_quota(
                    project_id=project_id
                    )
                return storage_space_quota, storage_space_quota - total_size
            else:
                return 0, 0

class AdminAPI(api_tools.APIModeHandler):
    @auth.decorators.check_api(["configuration.artifacts.artifacts.view"])
    def get(self, **kwargs):
        integration_id = request.args.get('integration_id')
        c = MinioClientAdmin(integration_id)
        buckets = c.list_bucket()
        bucket_types = {}
        total_size = 0
        for bucket in buckets:
            bucket_size = c.get_bucket_size(bucket)
            total_size += bucket_size
            response = c.get_bucket_tags(bucket)
            tags = {tag['Key']: tag['Value'] for tag in response['TagSet']} if response else {}
            if tags.get('type'):
                bucket_types[tags['type']] = bucket_types.get(tags['type'], 0) + bucket_size
        return {
            "total_bucket_size": {
                'readable': size(total_size),
                'bytes': total_size
                },
            "system_bucket_size": {
                'readable': size(bucket_types.get("system", 0)),
                'bytes': bucket_types.get("system", 0)
                },
            "autogenerated_bucket_size": {
                'readable': size(bucket_types.get("autogenerated", 0)),
                'bytes': bucket_types.get("autogenerated", 0)
                },
            "local_bucket_size": {
                'readable': size(bucket_types.get("local", 0)),
                'bytes': bucket_types.get("local", 0)
                },
            "storage_space_quota": {
                'readable': 0,
                'bytes': 0
                },
            "free_space": {
                'readable': 0,
                'bytes': 0
                },
            }, 200


class API(api_tools.APIBase):
    url_params = [
        '<string:project_id>',
        '<string:mode>/<string:project_id>',
    ]

    mode_handlers = {
        'default': ProjectAPI,
        'administration': AdminAPI
    }

from pylon.core.tools import log
log.info('API STORAGE')
