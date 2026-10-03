import React from "react";

type Employer = {
  id?: string;
  employer_id?: string;
  company_name?: string;
  business_name?: string;
  full_name?: string;
  email?: string;
  contact_no?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
  status?: string;
  created_at?: string;
  [key: string]: any;
};

type Props = {
  employers: Employer[];
  search: string;
  setSearch: (value: string) => void;

  loading: boolean;
  onRefresh: () => void;

  ModuleHeader: React.ComponentType<{
    title: string;
    description: string;
    onRefresh?: () => void;
  }>;

  TableHeader: React.ComponentType<{
    children: React.ReactNode;
  }>;

  TableCell: React.ComponentType<{
    children: React.ReactNode;
    bold?: boolean;
  }>;

  StatusBadge: React.ComponentType<{
    status: string;
  }>;

  LoadingMessage: React.ComponentType;

  EmptyMessage: React.ComponentType<{
    message: string;
  }>;
};

export default function EmployersModule({
  employers,
  search,
  setSearch,
  loading,
  onRefresh,
  ModuleHeader,
  TableHeader,
  TableCell,
  StatusBadge,
  LoadingMessage,
  EmptyMessage,
}: Props) {
  return (
    <div className="space-y-6">

      <ModuleHeader
        title="Employers"
        description="View registered employers and their information."
        onRefresh={onRefresh}
      />

      {/* SEARCH */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search employers..."
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        />

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {loading ? (
          <LoadingMessage />
        ) : employers.length === 0 ? (
          <EmptyMessage message="No employers found." />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Company / Employer
                  </TableHeader>

                  <TableHeader>
                    Email
                  </TableHeader>

                  <TableHeader>
                    Contact
                  </TableHeader>

                  <TableHeader>
                    Address
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {employers.map(
                  (employer, index) => {

                    const name =
                      employer.company_name ||
                      employer.business_name ||
                      employer.full_name ||
                      "Unnamed Employer";

                    const status =
                      employer.status ||
                      (
                        employer.is_active
                          ? "Active"
                          : "Inactive"
                      );

                    return (
                      <tr
                        key={
                          employer.id ||
                          employer.employer_id ||
                          index
                        }
                        className="hover:bg-slate-50"
                      >

                        <TableCell bold>
                          {name}
                        </TableCell>

                        <TableCell>
                          {employer.email || "-"}
                        </TableCell>

                        <TableCell>
                          {employer.contact_no ||
                            employer.phone ||
                            "-"}
                        </TableCell>

                        <TableCell>
                          {employer.address || "-"}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={status}
                          />
                        </TableCell>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}