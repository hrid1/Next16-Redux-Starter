"use client";

import React from 'react'
import useAuth from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1>This is dashboard</h1>

      <h1>Hi, {user?.name}</h1>
    </div>
  );
}
