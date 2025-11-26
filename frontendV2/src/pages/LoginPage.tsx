import React, { useState } from "react";
import {
  Button,
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Text,
  Stack,
  Anchor,
  Container,
} from "@mantine/core";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const { loginMutation } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.success) {
            navigate("/", { replace: true });
          }
        },
      }
    );
  };

  return (
    <Container size="xs" py="xl">
      <Paper radius="md" p="xl" withBorder>
        <Title order={2} mb="sm">
          Login
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Sign in to access your PocketLLM chats.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            {loginMutation.isError && (
              <Text size="sm" c="red">
                {(loginMutation.error as any)?.message || "Login failed"}
              </Text>
            )}
            <Button
              type="submit"
              loading={loginMutation.isPending}
              fullWidth
              mt="md"
            >
              Login
            </Button>
          </Stack>
        </form>

        <Text size="sm" mt="md">
          Don&apos;t have an account?{" "}
          <Anchor component={Link} to="/signup">
            Sign up
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default LoginPage;
