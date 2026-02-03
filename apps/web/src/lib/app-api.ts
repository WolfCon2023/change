/**
 * App API Hooks
 * API hooks for the business application layer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// Types
// =============================================================================

export interface Archetype {
  id: string;
  key: string;
  name: string;
  description: string;
  icon?: string;
  tags: string[];
  recommendedEntityTypes: string[];
  industryExamples: string[];
  displayOrder: number;
}

export interface ArchetypePreview {
  key: string;
  name: string;
  description: string;
  recommendedEntityTypes: string[];
  topProcesses: Array<{
    name: string;
    description: string;
    category: string;
    priority: number;
  }>;
  topKPIs: Array<{
    name: string;
    description: string;
    unit: string;
    targetDirection: string;
    category: string;
    frequency: string;
  }>;
  keyRisks: Array<{
    category: string;
    item: string;
    severity: string;
    mitigation?: string;
  }>;
}

export interface SetupStatus {
  hasStarted: boolean;
  isComplete: boolean;
  currentStep: string;
  progress: number;
  archetypeKey?: string;
  entityType?: string;
  state?: string;
  businessProfileId?: string;
  readinessFlags: Record<string, boolean>;
  blockers: string[];
  nextAction: {
    label: string;
    action: string;
    description: string;
    route?: string;
  };
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface RegisteredAgent {
  type: 'self' | 'commercial' | 'individual';
  name: string;
  address: Address;
  email?: string;
  phone?: string;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  dbaName?: string;
  businessType: string;
  formationState: string;
  email: string;
  phone?: string;
  website?: string;
  archetypeKey?: string;
  formationStatus: string;
  einStatus: string;
  profileCompleteness: number;
  readinessFlags: Record<string, boolean>;
  businessAddress?: Address;
  mailingAddress?: Address;
  registeredAgent?: RegisteredAgent;
  archetype?: {
    key: string;
    name: string;
    description: string;
    icon?: string;
  };
  ownersCount: number;
}

export interface HomeData {
  hasSetup: boolean;
  business?: {
    name: string;
    type: string;
    state: string;
    archetype?: {
      key: string;
      name: string;
      icon?: string;
    };
  };
  progress: {
    overall: number;
    setup: number;
    formation: number;
    operations: number;
  };
  nextAction: {
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    action: string;
    route?: string;
    buttonLabel: string;
  };
  blockers: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    route?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    status: string;
    category: string;
  }>;
  approvals: Array<{
    id: string;
    type: string;
    title: string;
    requestorName: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
  }>;
}

// =============================================================================
// Archetype Hooks
// =============================================================================

export function useArchetypes(search?: string) {
  return useQuery({
    queryKey: ['archetypes', search],
    queryFn: async () => {
      const params = search ? { search } : {};
      const { data } = await api.get('/app/archetypes', { params });
      return data.data as Archetype[];
    },
  });
}

export function useArchetype(key: string) {
  return useQuery({
    queryKey: ['archetype', key],
    queryFn: async () => {
      const { data } = await api.get(`/app/archetypes/${key}`);
      return data.data;
    },
    enabled: !!key,
  });
}

export function useArchetypePreview(key: string) {
  return useQuery({
    queryKey: ['archetype-preview', key],
    queryFn: async () => {
      const { data } = await api.get(`/app/archetypes/${key}/preview`);
      return data.data as ArchetypePreview;
    },
    enabled: !!key,
  });
}

// =============================================================================
// Setup Hooks
// =============================================================================

export function useSetupStatus() {
  return useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      const { data } = await api.get('/app/setup/status');
      return data.data as SetupStatus;
    },
  });
}

export function useStartSetup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { businessName: string; email: string }) => {
      const { data } = await api.post('/app/setup/start', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useSelectArchetype() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (archetypeKey: string) => {
      const { data } = await api.put('/app/setup/archetype', { archetypeKey });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useSelectEntityType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entityType: string) => {
      const { data } = await api.put('/app/setup/entity-type', { entityType });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useSelectState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (state: string) => {
      const { data } = await api.put('/app/setup/state', { state });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useCompleteSetup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: {
      businessName: string;
      dbaName?: string;
      email: string;
      phone?: string;
    }) => {
      const { data } = await api.post('/app/setup/complete', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

// =============================================================================
// Profile Hooks
// =============================================================================

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/app/profile');
      return data.data as BusinessProfile | null;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: Partial<BusinessProfile>) => {
      const { data } = await api.put('/app/profile', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useReadiness() {
  return useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const { data } = await api.get('/app/profile/readiness');
      return data.data;
    },
  });
}

export interface Owner {
  firstName: string;
  lastName: string;
  title: string;
  ownershipPercentage: number;
  email?: string;
}

export function useAddOwners() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (owners: Owner[]) => {
      const { data } = await api.post('/app/profile/owners', { owners });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useUpdateFormationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (status: 'pending' | 'filed' | 'approved' | 'rejected') => {
      const { data } = await api.post('/app/profile/formation-status', { status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useUpdateEINStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: { status: 'pending' | 'applied' | 'received'; einNumber?: string }) => {
      const { data } = await api.post('/app/profile/ein-status', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });
}

export function useUpdateFormationState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (stateCode: string) => {
      const { data } = await api.put('/app/profile/formation-state', { stateCode });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['setup-status'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['state-portal'] });
    },
  });
}

export function useStatePortal() {
  return useQuery({
    queryKey: ['state-portal'],
    queryFn: async () => {
      const { data } = await api.get('/app/profile/state-portal');
      return data.data;
    },
  });
}

// =============================================================================
// Reference Data Hooks
// =============================================================================

export interface StateFilingPortalData {
  code: string;
  state: string;
  agencyName: string;
  registrationUrl: string;
  notes?: string;
}

export function useStateFilingPortals() {
  return useQuery({
    queryKey: ['state-filing-portals'],
    queryFn: async () => {
      const { data } = await api.get('/app/reference/state-filing-portals');
      return data.data as StateFilingPortalData[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - this data rarely changes
  });
}

export function useStateFilingPortal(code: string) {
  return useQuery({
    queryKey: ['state-filing-portal', code],
    queryFn: async () => {
      const { data } = await api.get(`/app/reference/state-filing-portals/${code}`);
      return data.data as StateFilingPortalData;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// =============================================================================
// Home Hooks
// =============================================================================

export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    queryFn: async () => {
      const { data } = await api.get('/app/home');
      return data.data as HomeData;
    },
  });
}
