// Component Story Format (CSF3) source for Button - the local file button.yaml's
// `refs` (rel: storybook) points at. Distinct from the hosted docs link
// (https://storybook.org/ds/button) also in that array: this is the source
// CSF authors edit; that's where it renders once built.
//
// argTypes below intentionally mirror button.yaml's own `modes` section
// (variant, size, disabled, loading) - same facts, described for
// Storybook's controls panel instead of for a human/agent reader.
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../../src/button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
  args: {
    variant: "primary",
    size: "medium",
    disabled: false,
    loading: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Danger: Story = {
  args: { variant: "danger", size: "medium" },
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
