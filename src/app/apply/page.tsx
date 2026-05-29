import TenantApplicationForm from '@/components/applications/TenantApplicationForm'

export default async function ApplyPage({ searchParams }: { searchParams: { unitId?: string } }) {
  const { unitId } = await searchParams

  if (!unitId) {
    return <div className="p-8 text-center">Invalid Unit ID. Please select a property to apply for.</div>
  }

  return (
    <div className="container mx-auto py-12">
      <TenantApplicationForm unitId={unitId} />
    </div>
  )
}
