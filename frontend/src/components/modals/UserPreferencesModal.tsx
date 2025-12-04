import {
  Modal,
  Button,
  Select,
  Group,
  Stack,
  Textarea,
  TextInput, ComboboxItem,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import { setUserPreferences } from "../../store/userSlice";
import { UserPreferences } from "@common/types/account";
import { updateUserPreferences } from "../../services/account.service";
import { setUserCookie, getTokenFromCookie } from "../../utils/authCookies";
import {env} from "../../config/env";
import {useQuery} from "@tanstack/react-query";
import {queryKeys} from "../../lib/queryKeys";
import {apiClient} from "../../lib/apiClient";
import {OllamaModel} from "@common/types/ollama";
import {useMemo} from "react";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function UserPreferencesModal({ opened, onClose }: Props) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.user.user);

  const {data: models} = useQuery({
    queryKey: queryKeys.models.all,
    queryFn: () => apiClient.get<OllamaModel[]>(
      "/api/chat/models"
    ).then(res => res.data)
  })
  const modelOptions: ComboboxItem[] = useMemo(() => {
      return models?.map(model => ({value: model.name, label: model.name})) ?? []
    },
    [models]
  )

  const form = useForm<UserPreferences>({
    initialValues: {
      model: user?.preferences?.model ?? env.defaultModel,
      temp: user?.preferences?.temp ?? env.defaultTemperature,
      theme: user?.preferences?.theme ?? "light",
      custom_instructions: user?.preferences?.custom_instructions ?? "",
    },
  });

  const onSubmit = async (values: UserPreferences) => {
    try {
      const updatedUser = await updateUserPreferences(values);
      const currentToken = getTokenFromCookie();
      if (updatedUser && currentToken) {
        setUserCookie(updatedUser, currentToken);
        await dispatch(setUserPreferences(updatedUser.preferences));
      }
      onClose();
    } catch (err) {
      console.error("Failed to save preferences", err);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Preferences" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>
          <Select
            label="Theme"
            data={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            {...form.getInputProps("theme")}
          />

          <Select
            label="Preferred model"
            data={modelOptions}
            {...form.getInputProps("model")}
          />

          <NumberInput
            label="Default Model Temperature"
            min={0.0}
            max={2.0}
            step={0.1}
            decimalScale={1}
            {...form.getInputProps("temp")}
          />

          <Textarea
            label="Custom instructions"
            placeholder="Enter custom instructions used for all models."
            autosize
            minRows={5}
            {...form.getInputProps("custom_instructions")}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
