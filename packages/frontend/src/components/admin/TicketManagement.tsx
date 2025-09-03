"use client";

import { useState, useEffect } from 'react';
import { AddRegistrationModal } from './AddRegistrationModal';
import { EditRegistrationModal } from './EditRegistrationModal';
import { TicketDetailsModal } from './TicketDetailsModal';

interface Registration {
  id: string;
  wallet: string;
  nft: {
    contract: string;
    tokenId: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  method: string;
  verifiedAt: string;
  ticketId: string;
  checkedInAt?: string;
  notes?: string;
}

export function TicketManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked-in' | 'not-checked-in'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, registrations]);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/registrations?page=${currentPage}&limit=${pageSize}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.data.registrations);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error('Failed to fetch registrations');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.firstName.toLowerCase().includes(searchLower) ||
        reg.lastName.toLowerCase().includes(searchLower) ||
        reg.email.toLowerCase().includes(searchLower) ||
        reg.wallet.toLowerCase().includes(searchLower) ||
        reg.nft.tokenId.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter === 'checked-in') {
      filtered = filtered.filter(reg => reg.checkedInAt);
    } else if (statusFilter === 'not-checked-in') {
      filtered = filtered.filter(reg => !reg.checkedInAt);
    }

    setFilteredRegistrations(filtered);
  };

  const handleCheckIn = async (registrationId: string) => {
    try {
      // Find the registration to get the ticketId
      const registration = registrations.find(reg => reg.id === registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkin/${registration.ticketId}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Refresh registrations
        fetchRegistrations();
      } else {
        throw new Error('Check-in failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Check-in failed');
    }
  };

  const handleCheckOut = async (registrationId: string) => {
    try {
      // Find the registration to get the ticketId
      const registration = registrations.find(reg => reg.id === registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkin/${registration.ticketId}/checkout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Refresh registrations
        fetchRegistrations();
      } else {
        throw new Error('Check-out failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Check-out failed');
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/registrations/${registrationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Refresh registrations
        fetchRegistrations();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const openEditModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowEditModal(true);
  };

  const openTicketModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowTicketModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowTicketModal(false);
    setSelectedRegistration(null);
  };

  const handleRegistrationUpdated = () => {
    fetchRegistrations();
    closeModals();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading registrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Registrations</h2>
          <p className="text-sm text-gray-600">
            Manage all NFT registrations and check-ins
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Registration
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Name, email, wallet, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="all">All Registrations</option>
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-800">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Registrations Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NFT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {registration.firstName} {registration.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{registration.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        Token #{registration.nft.tokenId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {registration.nft.contractName || 'Unknown Contract'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {registration.nft.contract.slice(0, 6)}...{registration.nft.contract.slice(-4)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {registration.wallet.slice(0, 6)}...{registration.wallet.slice(-4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {registration.checkedInAt ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Checked In
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openTicketModal(registration)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(registration)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      {registration.checkedInAt ? (
                        <button
                          onClick={() => handleCheckOut(registration.id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Check Out
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(registration.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(registration.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding a new registration.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddRegistrationModal
          onClose={closeModals}
          onSuccess={handleRegistrationUpdated}
        />
      )}

      {showEditModal && selectedRegistration && (
        <EditRegistrationModal
          registration={selectedRegistration}
          onClose={closeModals}
          onSuccess={handleRegistrationUpdated}
        />
      )}

      {showTicketModal && selectedRegistration && (
        <TicketDetailsModal
          registration={selectedRegistration}
          onClose={closeModals}
          onCheckIn={() => {
            handleCheckIn(selectedRegistration.id);
            closeModals();
          }}
          onEdit={() => {
            closeModals();
            openEditModal(selectedRegistration);
          }}
        />
      )}
    </div>
  );
}
