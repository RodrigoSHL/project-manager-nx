export interface ApiProject {
  id: string
  name: string
  shortName: string | null
  businessUnit: string
  description: string
  status: 'planning' | 'development' | 'testing' | 'staging' | 'production' | 'maintenance' | 'deprecated'
  priority: 'low' | 'medium' | 'high' | 'critical'
  version: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}
