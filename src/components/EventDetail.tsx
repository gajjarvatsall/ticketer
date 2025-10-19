import { useState, useEffect } from "react";
import { eventService, Event } from "../services/api";
import { toast } from "sonner";
import BookingForm from "./BookingForm";

interface EventDetailProps {
  eventId: string;
  onBack: () => void;
}

export default function EventDetail({ eventId, onBack }: EventDetailProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getById(eventId);
      setEvent(data.event);
    } catch (error: any) {
      toast.error("Failed to load event details");
      console.error("Error loading event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Event not found.</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  if (showBookingForm) {
    return (
      <BookingForm
        event={event}
        onBack={() => setShowBookingForm(false)}
        onSuccess={() => {
          toast.success("Booking successful!");
          setShowBookingForm(false);
        }}
      />
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center font-medium"
      >
        ← Back to Events
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Event Header */}
        <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <h1 className="text-white text-4xl font-bold text-center px-6">
            {event.title}
          </h1>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                    {event.category}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {new Date(event.dateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <span className="mr-2">📍</span>
                  <span>{event.venue.name}, {event.venue.city}</span>
                </div>

                {event.organizer && (
                  <div className="flex items-center text-gray-600 mb-6">
                    <span className="mr-2">👤</span>
                    <span>Organized by {event.organizer.name}</span>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Ticket Information */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets</h3>
                
                <div className="space-y-4 mb-6">
                  {event.ticketTypes.map((ticket, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{ticket.name}</h4>
                        <span className="text-lg font-bold text-gray-900">${ticket.price.toFixed(2)}</span>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {ticket.quantity} available
                        </span>
                        <span className="font-medium text-green-600">
                          Available
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Book Tickets
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
