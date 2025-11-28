import React from "react";
import {Anchor, Box, Button, Flex, PasswordInput, Stack, Text, TextInput, Title,} from "@mantine/core";
import {Link, useNavigate} from "react-router";
import {useAuth} from "../hooks/useAuth";
import {useForm, yupResolver} from "@mantine/form";
import * as yup from "yup";

const passwordSchema = yup
  .string()
  .required("Password is required")
  .min(8, "Use 8 or more characters")
  .matches(/[A-Z]/, "Must contain at least one uppercase letter")
  .matches(/[a-z]/, "Must contain at least one lowercase letter")
  .matches(/[0-9]/, "Must contain at least one number")
  .matches(/[^A-Za-z0-9]/, "Must contain at least one special character");

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  password: passwordSchema,
});

const SignupPage: React.FC = () => {
  const {signupMutation} = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: "",
      username: "",
      password: "",
    },
    validate: yupResolver(schema),
  });

  const handleSubmit = form.onSubmit((values) => {
    signupMutation.mutate(values, {
      onSuccess: (data) => {
        if (data.success) {
          navigate("/", {replace: true});
        }
      },
    });
  });

  return (
    <Flex mih="100vh">
      {/* LEFT SIDE – FORM */}
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
        <Box style={{width: "100%", maxWidth: 480}}>
          <Title order={1} mb="xs">
            Welcome to PocketLLM
          </Title>
          <Text size="sm" mb="xl">
            Don&apos;t have an account yet? Sign up below.
          </Text>

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

              {/* Username */}
              <div>
                <Text size="sm" mb={4}>
                  Name
                </Text>
                <TextInput
                  placeholder="Choose a username"
                  {...form.getInputProps("username")}
                />
              </div>

              {/* Password */}
              <div>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text size="sm">Password</Text>
                </Flex>
                <PasswordInput
                  placeholder="Create a strong password"
                  visibilityToggleButtonProps={{
                    label: "Toggle password visibility"
                  }}
                  {...form.getInputProps("password")}
                />
              </div>

              {/* Password rules list */}
              <Box mt={4}>
                <Text size="xs">● Use 8 or more characters</Text>
                <Text size="xs">● One uppercase character</Text>
                <Text size="xs">● One lowercase character</Text>
                <Text size="xs">● One special character</Text>
                <Text size="xs">● One number</Text>
              </Box>

              {/* Error from API */}
              {signupMutation.isError && (
                <Text size="sm" c="red">
                  {(signupMutation.error as any)?.message ||
                    "Sign up failed. Please try again."}
                </Text>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                fullWidth
                mt="sm"
                loading={signupMutation.isPending}
              >
                Create an account
              </Button>
            </Stack>
          </form>

          <Text size="sm" mt="lg">
            Already have an account?{" "}
            <Anchor component={Link} to="/login" fw={500}>
              Log in
            </Anchor>
          </Text>
        </Box>
      </Box>

      {/* RIGHT SIDE – BACKGROUND IMAGE */}
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

export default SignupPage;
