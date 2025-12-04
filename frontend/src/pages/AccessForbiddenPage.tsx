import { Button, Center, Stack, Text, Title, Image } from "@mantine/core";
import { useNavigate } from "react-router";
import Image403 from "../public/403.avif"

export function AccessForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Center h="100vh" px="md">
      <Stack align="center" gap="md" maw={460}>
        <Image
          src={Image403}   // your local public folder image
          alt="Access Forbidden"
          w={260}
        />

        <Title order={2} ta="center">
          Access Forbidden
        </Title>

        <Text c="dimmed" ta="center">
          You do not have permission to access this page.
        </Text>

        <Button variant="light" size="md" onClick={() => navigate(-2)}>
          Go Back
        </Button>
      </Stack>
    </Center>
  );
}
