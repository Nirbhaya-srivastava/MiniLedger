import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Map common Ionicons / Feather / Material names to Lucide icons
const iconMap: Record<string, keyof typeof Icons> = {
  'cash-outline': 'Banknote',
  'close': 'X',
  'close-circle': 'XCircle',
  'search': 'Search',
  'warning': 'AlertTriangle',
  'alert-circle': 'AlertCircle',
  'checkmark-circle': 'CheckCircle2',
  'checkmark-done': 'CheckCheck',
  'checkmark': 'Check',
  'refresh': 'RotateCcw',
  'trash-2': 'Trash2',
  'time-outline': 'Clock',
  'image-outline': 'Image',
  'camera-outline': 'Camera',
  'calendar-outline': 'Calendar',
  'person-outline': 'User',
  'person-circle': 'UserCircle',
  'call-outline': 'Phone',
  'chevron-down': 'ChevronDown',
  'arrow-forward': 'ArrowRight',
  'arrow-up-right': 'ArrowUpRight',
  'key-outline': 'Key',
  'flash': 'Zap',
  'shield-checkmark': 'ShieldCheck',
  'trending-up': 'TrendingUp',
  'sparkles': 'Sparkles',
  'add': 'Plus',
  'terminal': 'Terminal',
  'console-line': 'Terminal',
  'console-network': 'Terminal',
  'log-out-outline': 'LogOut',
  'receipt-outline': 'Receipt',
  'information-circle': 'Info',
  'play': 'Play',
};

export const createIconComponent = (defaultIcon: keyof typeof Icons) => {
  return ({ name, size = 18, color = '#000000', style }: IconProps) => {
    const lucideName = (iconMap[name] || defaultIcon) as keyof typeof Icons;
    const Component = (Icons[lucideName] || Icons.Circle) as React.ComponentType<any>;

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <Component size={size} color={color} strokeWidth={2.2} />
      </span>
    );
  };
};

export const Ionicons = createIconComponent('Sparkles');
export const Feather = createIconComponent('Circle');
export const MaterialCommunityIcons = createIconComponent('Terminal');
export const MaterialIcons = createIconComponent('Sparkles');

export default {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
};
