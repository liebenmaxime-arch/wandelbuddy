// Pushmeldingen: publieke gegevens (mogen in de openbare repository).
// De private VAPID-sleutel staat NOOIT hier, alleen als geheim in de Cloudflare Worker.
export const pushConfig = {
  vapidPublicKey: 'BBqrnKHZY_TupUbouqlvXT0sJQrwQukBCa8LpswWTlFGJBPmKtvWYowcplDWiwHrZ5EwXJEDg8bNjbcZ4Qt7KbA',
  workerUrl: 'https://wandelbuddy-push.liebenmaxime.workers.dev',
};
