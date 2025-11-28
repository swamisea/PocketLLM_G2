import React from "react";
import {Anchor, Box, Button, Flex, PasswordInput, Stack, Text, TextInput, Title,} from "@mantine/core";
import {Link, useNavigate} from "react-router";
import {useAuth} from "../hooks/useAuth";
import {useForm, yupResolver} from "@mantine/form";
import * as yup from "yup";

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const LoginPage: React.FC = () => {
  const {loginMutation} = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: yupResolver(schema),
  });

  const handleSubmit = form.onSubmit((values: any) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        if (data.success) {
          navigate("/", {replace: true});
        }
      },
    });
  });

  return (
    <Flex mih="100vh">
      {/* LEFT SIDE */}
      <Box
        style={(theme: any) => ({
          flex: 1,
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.dark[8],
          color: theme.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
        })}
      >
        <Box style={{width: "100%", maxWidth: 420}}>
          <Title order={1} mb="lg">
            Welcome to PocketLLM
          </Title>

          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {/* Email */}
              <div>
                <Text size="sm" mb={4}>
                  Email
                </Text>
                <TextInput
                  placeholder="you@example.com"
                  {...form.getInputProps("email")}
                />
              </div>

              {/* Password */}
              <div>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text size="sm">Password</Text>
                </Flex>
                <PasswordInput
                  placeholder="Your password"
                  visibilityToggleButtonProps={{
                    label: "Toggle password visibility"
                  }}
                  {...form.getInputProps("password")}
                />
              </div>

              {/* Error */}
              {loginMutation.isError && (
                <Text size="sm" c="red">
                  {(loginMutation.error as any)?.message ||
                    "Login failed. Please try again."}
                </Text>
              )}

              {/* Submit */}
              <Button
                type="submit"
                fullWidth
                loading={loginMutation.isPending}
                mt="sm"
              >
                Login
              </Button>
            </Stack>
          </form>

          <Text size="sm" mt="lg">
            Don&apos;t have an account?{" "}
            <Anchor component={Link} to="/signup" fw={500}>
              Sign Up
            </Anchor>
          </Text>
        </Box>
      </Box>

      <Box
        style={{
          flex: 1,
          backgroundImage:
            'url("https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </Flex>
  );
};

export default LoginPage;
