'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EventAnnouncementPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:8000/api/events', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setEvents(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:8000/api/events?mine=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMyEvents(data.data);
      }
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert('Registration successful!');
        fetchMyEvents();
        setSelectedEvent(null);
      } else {
        alert(data.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">InstaFlow AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/community" className="text-gray-600 hover:text-gray-900">
                Community
              </Link>
              <Link href="/membership" className="text-gray-600 hover:text-gray-900">
                Membership
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  window.location.href = '/login';
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Event Announcements
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Discover and register for upcoming events
              </p>
            </div>
            <button
              onClick={fetchMyEvents}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              My Events ({myEvents.length})
            </button>
          </div>

          {/* My Events Section */}
          {myEvents.length > 0 && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  My Registered Events
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {myEvents.map((event: any) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="border rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                        </div>
                        {event.status === 'upcoming' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {event.status}
                          </span>
                        )}
                        {event.status === 'ongoing' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {event.status}
                          </span>
                        )}
                        {event.status === 'past' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        {event.start_date && (
                          <div className="flex items-center">
                            <span>📅 {formatDate(event.start_date)}</span>
                          </div>
                        )}
                        {event.end_date && (
                          <div className="flex items-center">
                            <span>🕰 {formatDate(event.end_date)}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <span>📍 {event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-600">
                          {event.participant_count} / {event.capacity} registered
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Events Section */}
          <div className="mt-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              All Events
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event: any) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {event.image_url && (
                    <div className="h-48 w-full bg-gray-200">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'upcoming' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : event.status === 'ongoing'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'past'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {event.start_date && (
                          <span className="flex items-center">
                            📅 {formatDate(event.start_date)}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center">
                            📍 {event.location}
                          </span>
                        )}
                        <span className="flex items-center">
                          👥 {event.participant_count}/{event.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {selectedEvent.image_url && (
                <div className="mb-4">
                  <img
                    src={selectedEvent.image_url}
                    alt={selectedEvent.title}
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <p className="text-gray-700">{selectedEvent.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span>📅 Start:</span>
                    <span className="ml-2 font-medium">
                      {selectedEvent.start_date ? formatDate(selectedEvent.start_date) : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span>🕰 End:</span>
                    <span className="ml-2 font-medium">
                      {selectedEvent.end_date ? formatDate(selectedEvent.end_date) : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span>📍 Location:</span>
                    <span className="ml-2 font-medium">
                      {selectedEvent.location || 'Online'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span>👥 Capacity:</span>
                    <span className="ml-2 font-medium">
                      {selectedEvent.capacity}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{selectedEvent.participant_count}</span> registered
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedEvent.capacity - selectedEvent.participant_count} spots left
                      </p>
                    </div>
                    <button
                      onClick={() => handleRegister(selectedEvent.id)}
                      disabled={selectedEvent.status === 'past' || selectedEvent.status === 'cancelled'}
                      className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                        selectedEvent.status === 'past' || selectedEvent.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {selectedEvent.status === 'past' || selectedEvent.status === 'cancelled'
                        ? 'Registration Closed'
                        : 'Register Now'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
