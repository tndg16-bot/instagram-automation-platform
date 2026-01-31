'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_at: string;
  end_at?: string;
  location_type: string;
  location_address?: string;
  meeting_url?: string;
  capacity?: number;
  image_url?: string;
  status: string;
  registered_count?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my'>('upcoming');

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.data?.events || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:8000/api/events/my-events', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch my events');
      
      const data = await response.json();
      setMyEvents(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        alert('Registered successfully!');
        fetchMyEvents();
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const displayEvents = activeTab === 'upcoming' ? events : myEvents;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Events</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded ${activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            My Events
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-48 object-cover" />
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                    {event.event_type}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded capitalize">
                    {event.status}
                  </span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h2>
                
                {event.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(event.start_at).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(event.start_at).toLocaleTimeString()}
                  </p>
                  <p>
                    <span className="font-medium">Location:</span>{' '}
                    {event.location_type === 'online' ? 'Online' : event.location_address}
                  </p>
                  {event.capacity && (
                    <p>
                      <span className="font-medium">Capacity:</span>{' '}
                      {event.registered_count || 0} / {event.capacity}
                    </p>
                  )}
                </div>
                
                {activeTab === 'upcoming' && event.status === 'upcoming' && (
                  <button
                    onClick={() => handleRegister(event.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Register
                  </button>
                )}
                
                {activeTab === 'my' && (
                  <Link
                    href={event.meeting_url || '#'}
                    className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Join Event
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {displayEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'upcoming' ? 'No upcoming events' : 'You haven\'t registered for any events yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
