import React from 'react';

export enum PlatformType {
  PS5 = 'PS5',
  SWITCH = 'Switch 1/2',
  XBOX = 'Xbox',
  STEAM = 'Steam'
}

export interface Game {
  id: string;
  name: string;
  platform: PlatformType;
  category: 'single' | 'multi';
  imageUrl?: string;
  isLoadingImage?: boolean; // Renamed from isGenerating
  selected?: boolean;
}

export interface PlatformConfig {
  id: PlatformType;
  label: string;
  color: string;
  icon: React.ReactNode;
}