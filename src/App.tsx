import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import SignInForm from "./SignInForm";
import SignOutButton from "./SignOutButton";
import EventList from "./components/EventList";
import EventDetail from "./components/EventDetail";
import CreateEvent from "./components/CreateEvent";
import MyOrders from "./components/MyOrders";
import MyEvents from "./components/MyEvents";
import { Toaster } from "sonner";

type View = "events" | "event-detail" | "create-event" | "my-orders" | "my-events";

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>("events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to EventTicket
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to book tickets and manage events
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "events":
        return (
          <EventList
            onEventSelect={(eventId) => {
              setSelectedEventId(eventId);
              setCurrentView("event-detail");
            }}
          />
        );
      case "event-detail":
        return selectedEventId ? (
          <EventDetail
            eventId={selectedEventId}
            onBack={() => setCurrentView("events")}
          />
        ) : null;
      case "create-event":
        return (
          <CreateEvent
            onBack={() => setCurrentView("events")}
            onEventCreated={() => setCurrentView("my-events")}
          />
        );
      case "my-orders":
        return <MyOrders />;
      case "my-events":
        return <MyEvents />;
      default:
        return <EventList onEventSelect={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">EventTicket</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("events")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "events"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Events
              </button>
              <button
                onClick={() => setCurrentView("create-event")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "create-event"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Create Event
              </button>
              <button
                onClick={() => setCurrentView("my-events")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "my-events"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Events
              </button>
              <button
                onClick={() => setCurrentView("my-orders")}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === "my-orders"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Orders
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Welcome, {user.firstName || user.email}
                </span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderView()}
      </main>
    </div>
  );
}
