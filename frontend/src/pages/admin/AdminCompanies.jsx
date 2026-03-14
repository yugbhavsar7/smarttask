import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { Spinner, PageHeader, EmptyState } from '../../components/UI'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/companies/').then(({ data }) => {
      setCompanies(data.results || data)
    }).catch(() => toast.error('Failed to load companies.'))
    .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" subtitle="All registered client companies" />
      <div className="card p-0 overflow-hidden">
        {loading ? <Spinner /> : companies.length === 0 ? <EmptyState message="No companies registered." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Company','Email','Contact','Address','Registered'].map(h=><th key={h} className="text-left py-3 px-4 label">{h}</th>)}</tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">{c.company_name}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{c.email}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{c.contact_no}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-[160px] truncate">{c.address}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
