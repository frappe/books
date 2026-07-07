import { Fyo } from 'fyo';

export async function sendNtfyNotification(fyo: Fyo, message: string, title?: string, tags?: string, priority?: string) {
  const settings = fyo.singles.POSSettings;
  if (!settings || !settings.enableMobileNotifications || !settings.messageChannel) {
    return;
  }

  const topic = settings.messageChannel;

  // Validate topic matches ntfy.sh pattern (alphanumeric, dashes, underscores)
  const topicPattern = /^[A-Za-z0-9_-]+$/;
  if (!topic || !topicPattern.test(topic)) {
    console.error('Invalid ntfy topic:', topic);
    return;
  }

  const encodedTopic = encodeURIComponent(topic);
  const url = `https://ntfy.sh/${encodedTopic}`;

  const headers: Record<string, string> = {
    'Markdown': 'yes'
  };

  if (title) {
    headers['Title'] = title;
  }

  if (tags) {
    headers['Tags'] = tags;
  }

  if (priority) {
    headers['Priority'] = priority;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      method: 'POST',
      body: message,
      headers: headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send ntfy notification:', error);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Ntfy notification request timed out');
    } else {
      console.error('Error sending ntfy notification:', error);
    }
  }
}
