import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router";
import { useSelector } from "react-redux";

import { router } from "./router";
import type { RootState } from "./store";

export function App() {
  const user = useSelector((state: RootState) => state.user.user);
  const theme = user?.preferences?.theme || "light";

  return (
    <MantineProvider forceColorScheme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>
  );
}
