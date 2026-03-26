import json

from channels.generic.websocket import AsyncWebsocketConsumer


class CandidaturesConsumer(AsyncWebsocketConsumer):
    group_name = 'candidatures_updates'

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Endpoint broadcast-only for now.
        return

    async def candidature_status_changed(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    'type': 'candidature_status_changed',
                    'candidature_id': event.get('candidature_id'),
                    'candidate_user_id': event.get('candidate_user_id'),
                    'new_status': event.get('new_status'),
                    'updated_at': event.get('updated_at'),
                }
            )
        )
