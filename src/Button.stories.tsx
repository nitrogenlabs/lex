import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

interface ButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'lg' | 'md' | 'sm';
  variant?: 'outline' | 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({
  children,
  disabled = false,
  onClick,
  size = 'md',
  variant = 'primary'
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
  };

  const sizeClasses = {
    lg: 'px-6 py-3 text-lg',
    md: 'px-4 py-2 text-base',
    sm: 'px-3 py-1.5 text-sm'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`;

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const meta: Meta<typeof Button> = {
  argTypes: {
    disabled: {
      control: {type: 'boolean'}
    },
    size: {
      control: {type: 'select'},
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: {type: 'select'},
      options: ['primary', 'secondary', 'outline']
    }
  },
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  title: 'Components/Button'
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary'
  }
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary'
  }
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline'
  }
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm'
  }
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg'
  }
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true
  }
};