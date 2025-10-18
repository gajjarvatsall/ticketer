import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import BookingForm from "./BookingForm";

interface EventDetailProps {
  eventId: Id<"events">;
  onBack: () => void;
}

export default function EventDetail({ eventId, onBack }: EventDetailProps) {
  const event = useQuery(api.events.getById, { id: eventId });
  const [showBookingForm, setShowBookingForm] = useState(false);

  if (event === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (event === null) {
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

  const hasAvailableTickets = event.ticketTypes.some(ticket => ticket.available > 0);

  return (
    <div className="px-4 sm:px-0">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center"
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {event.category}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <span className="mr-2">📍</span>
                  <span>{event.location}</span>
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
                        <span className="text-lg font-bold text-gray-900">${ticket.price}</span>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {ticket.available} of {ticket.quantity} available
                        </span>
                        <span className={`font-medium ${
                          ticket.available > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {ticket.available > 0 ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {hasAvailableTickets ? (
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Book Tickets
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    Sold Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          event={event}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            setShowBookingForm(false);
            // Optionally redirect to orders page
          }}
        />
      )}
    </div>
  );
}
