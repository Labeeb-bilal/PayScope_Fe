'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm" maw={420} ta="center">
        <Title order={2}>Something went wrong</Title>
        <Text c="dimmed">This page hit an unexpected error. Your data is safe. Try again, or reload the page.</Text>
        <Button onClick={reset}>Try again</Button>
      </Stack>
    </Center>
  );
}
