"use client"

import { TravelerLayout } from "@/components/traveler-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, Gift, MessageSquare, Package, CreditCard, Star, AlertCircle, X, Eye } from "lucide-react"

export default function TravelerNotificationsPage() {
  const categories = [
    { name: "All Notifications", count: 7, icon: Bell },
    { name: "Unread", count: 4, icon: Mail },
    { name: "Offers", count: 2, icon: Gift },
    { name: "Messages", count: 1, icon: MessageSquare },
    { name: "Deliveries", count: 1, icon: Package },
    { name: "Payments", count: 1, icon: CreditCard },
    { name: "Ratings & Reviews", count: 1, icon: Star },
    { name: "System Alerts", count: 1, icon: AlertCircle },
  ]

  const notifications = [
    {
      id: 1,
      icon: Gift,
      title: "New Offer Received",
      description: "Traveler Sarah J. made an offer for your request 'Laptop Charger'.",
      time: "5 minutes ago",
      isNew: true,
      isUnread: true,
    },
    {
      id: 2,
      icon: MessageSquare,
      title: "New Message from Jane D.",
      description: "You have a new message regarding 'Vintage Camera'.",
      time: "1 hour ago",
      isNew: true,
      isUnread: true,
    },
    {
      id: 3,
      icon: Package,
      title: "Delivery Update: 'Rare Comic Book'",
      description: "Your item is now in transit and will arrive soon.",
      time: "2 hours ago",
      isNew: true,
      isUnread: true,
    },
    {
      id: 4,
      icon: CreditCard,
      title: "Payment Confirmed for 'French Press'",
      description: "Your payment has been successfully processed.",
      time: "2 hours ago",
      isNew: false,
      isUnread: false,
    },
    {
      id: 5,
      icon: AlertCircle,
      title: "Platform Update: New Features!",
      description: "Explore our new tracking system and enhanced features.",
      time: "1 day ago",
      isNew: true,
      isUnread: true,
    },
    {
      id: 6,
      icon: Star,
      title: "Reminder: Rate Your Experience",
      description: "Please rate your recent delivery of 'Handmade Leather Bag'.",
      time: "2 days ago",
      isNew: false,
      isUnread: false,
    },
    {
      id: 7,
      icon: Gift,
      title: "Offer Declined for 'Limited Edition Sneakers'",
      description: "Traveler Sarah J. declined your counter-offer.",
      time: "3 days ago",
      isNew: false,
      isUnread: false,
    },
  ]

  return (
    <TravelerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <div className="flex gap-2">
            <Button variant="outline">Mark All as Read</Button>
            <Button variant="destructive">Clear All</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4">
              <h2 className="font-semibold text-foreground mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.name}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{category.name}</span>
                      </div>
                      <Badge variant="secondary">{category.count}</Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3 space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <div
                  key={notification.id}
                  className={`bg-card rounded-lg border p-4 ${notification.isUnread ? "ring-1 ring-[#0088cc]/40" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        notification.isUnread ? "bg-muted text-[#0088cc]" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                            {notification.isNew && <Badge className="bg-[#0088cc] text-white">New</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Mark as Read
                          </Button>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                          <Button variant="link" size="sm" className="text-foreground">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </TravelerLayout>
  )
}
