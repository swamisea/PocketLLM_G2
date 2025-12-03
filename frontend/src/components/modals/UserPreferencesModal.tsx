import { Modal, Button, Select, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setUserPreferences } from '../../store/userSlice';
import { UserPreferences } from '@common/types/account';
import { updateUserPreferences } from '../../services/account.service';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export default function UserPreferencesModal({ opened, onClose }: Props) {
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.user.user);

  const form = useForm<UserPreferences>({
    initialValues: {
        model: user?.preferences?.model ?? 'gemma3:270m',
        temp: user?.preferences?.temp ?? 0.7,
        theme: user?.preferences?.theme ?? 'light',
        custom_instructions: user?.preferences?.custom_instructions?? ''
    },
  });

  const onSubmit = async (values: UserPreferences) => {
    try {
      const updatedUser = await updateUserPreferences(values);
      await dispatch(setUserPreferences(updatedUser.preferences));
      onClose();
    } catch (err) {
      console.error('Failed to save preferences', err);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Preferences" centered>
      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack>

            <Select
            label="Theme"
            data={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' }
            ]}
            {...form.getInputProps('theme')}
          />
          
          <Select
            label="Preferred model"
            data={[
              { value: 'gemma3:270m', label: 'Gemma3:270M' },
              { value: 'qwen3:0.6b', label: 'Qwen3:0.6b' }
            ]}
            {...form.getInputProps('model')}
          />

          <TextInput 
            label="Default Model Temperature"
            type='number'
            {...form.getInputProps('temp')}
          />

          <Textarea
            label="Custom instructions"
            placeholder="Enter custom instructions used for all models."
            {...form.getInputProps('custom_instructions')}
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
// ...existing code...