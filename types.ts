import React from 'react';

export enum PlatformType {
  PS5 = 'PS5',
  SWITCH = 'Switch 1/2',
  XBOX = 'Xbox',
  STEAM = 'Steam',
  BATTLENET = 'Battle.net',
  PC = 'PC'
}

export interface Game {
  id: string;
  name: string;
  platform: PlatformType;
  category: 'single' | 'multi';
  imageUrl?: string;
  isLoadingImage?: boolean; // Renamed from isGenerating
  selected?: boolean;
  isPlatinum?: boolean; // New property for PS5 platinum status
}

export interface PlatformConfig {
  id: PlatformType;
  label: string;
  color: string;
  icon: React.ReactNode;
}

export interface User {
  username: string;
  email?: string;
  password?: string;
  games: Game[];
  platforms: PlatformType[];
}