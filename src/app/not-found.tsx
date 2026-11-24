'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Center mih="60vh">
      <Stack align="center" gap="sm" ta="center">
        <Title order={2}>Page not found</Title>
        <Text c="dimmed">The page you are looking for doesn&apos;t exist.</Text>
        <Button component={Link} href="/">
          Back to employees
        </Button>
      </Stack>
    </Center>
  );
}
