import type { Meta, StoryObj } from '@storybook/vue3-vite';
import EnergyRing from './EnergyRing.vue';

const meta: Meta<typeof EnergyRing> = {
  title: 'Components/EnergyRing',
  component: EnergyRing,
  tags: ['autodocs'],
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 150, step: 1 } },
    consumed: { control: 'number' },
    target: { control: 'number' },
    size: { control: 'number' },
    strokeWidth: { control: 'number' }
  }
};

export default meta;
type Story = StoryObj<typeof EnergyRing>;

export const Default: Story = {
  args: {
    progress: 45,
    consumed: 1200,
    target: 2500,
    size: 200,
    strokeWidth: 16
  }
};

export const GoalReached: Story = {
  args: {
    progress: 100,
    consumed: 2500,
    target: 2500,
    size: 200,
    strokeWidth: 16
  }
};

export const OverConsuming: Story = {
  args: {
    progress: 115,
    consumed: 2875,
    target: 2500,
    size: 200,
    strokeWidth: 16
  }
};

export const Small: Story = {
  args: {
    progress: 75,
    consumed: 1500,
    target: 2000,
    size: 140,
    strokeWidth: 12
  }
};
