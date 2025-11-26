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

const SignupPage: React.FC = () => {
  const { signupMutation } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(
      { email, username, password },
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
          Sign up
        </Title>
        <Text size="sm" c="dimmed" mb="lg">
          Create an account to start chatting with models.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <TextInput
              label="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />
            <PasswordInput
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            {signupMutation.isError && (
              <Text size="sm" c="red">
                {(signupMutation.error as any)?.message || "Sign up failed"}
              </Text>
            )}

            <Button
              type="submit"
              loading={signupMutation.isPending}
              fullWidth
              mt="md"
            >
              Sign up
            </Button>
          </Stack>
        </form>

        <Text size="sm" mt="md">
          Already have an account?{" "}
          <Anchor component={Link} to="/login">
            Log in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default SignupPage;
