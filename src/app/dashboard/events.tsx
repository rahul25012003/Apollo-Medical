"use client";

import React, { useState } from "react";
import {
    Calendar,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Users,
    MapPin,
    Clock,
    IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const events = [
    {
        id: 1,
        title: "Epilepsy Management CME Session",
        category: "CME Session",
        date: "2025-12-29",
        time: "02:00 PM",
        venue: "NIMHANS, Bangalore",
        totalSlots: 80,
        bookedSlots: 72,
        price: 1500,
        status: "active",
        description: "Latest advances in epilepsy diagnosis, medical management, and surgical interventions.",
    },
    {
        id: 2,
        title: "Deep Brain Stimulation Workshop",
        category: "Workshop",
        date: "2026-01-05",
        time: "09:00 AM",
        venue: "CMC Vellore",
        totalSlots: 30,
        bookedSlots: 27,
        price: 4500,
        status: "active",
        description: "Hands-on workshop on DBS programming, troubleshooting, and patient management.",
    },
    {
        id: 3,
        title: "National Neurostimulation Summit 2026",
        category: "Conference",
        date: "2026-01-10",
        time: "09:00 AM",
        venue: "AIIMS, New Delhi",
        totalSlots: 200,
        bookedSlots: 156,
        price: 6500,
        status: "active",
        description: "India's premier neurostimulation conference with live surgical demonstrations.",
    },
    {
        id: 4,
        title: "Neural Engineering Research Symposium",
        category: "Symposium",
        date: "2026-01-18",
        time: "09:00 AM",
        venue: "Virtual Event",
        totalSlots: 200,
        bookedSlots: 89,
        price: 2000,
        status: "upcoming",
        description: "Cutting-edge research in brain-computer interfaces and neuroprosthetics.",
    },
    {
        id: 5,
        title: "Movement Disorders Update 2025",
        category: "Workshop",
        date: "2025-12-15",
        time: "09:00 AM",
        venue: "KEM Hospital, Mumbai",
        totalSlots: 65,
        bookedSlots: 65,
        price: 1200,
        status: "completed",
        description: "Annual update on Parkinson's disease, dystonia, and essential tremor management.",
    },
];

export default function EventsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState("all");

    const filteredEvents = events.filter((event) => {
        if (selectedTab === "all") return true;
        return event.status === selectedTab;
    });

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">
                        Manage conferences, workshops, and CME sessions
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new conference or workshop.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Event Title *</Label>
                                <Input id="title" placeholder="e.g., CME Session 2025" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="workshop">Workshop</SelectItem>
                                            <SelectItem value="cme">CME Session</SelectItem>
                                            <SelectItem value="symposium">Symposium</SelectItem>
                                            <SelectItem value="conference">Conference</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Event Date *</Label>
                                    <Input id="date" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="time">Event Time *</Label>
                                    <Input id="time" type="time" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="venue">Venue *</Label>
                                <Input id="venue" placeholder="e.g., Conference Hall A" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="slots">Total Slots *</Label>
                                    <Input id="slots" type="number" placeholder="100" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Registration Fee (₹) *</Label>
                                    <Input id="price" type="number" placeholder="5000" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe the event, topics covered, target audience..."
                                    rows={4}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cmeCredits">CME Credits (if applicable)</Label>
                                <Input id="cmeCredits" type="number" placeholder="e.g., 8" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="regStart">Registration Start</Label>
                                    <Input id="regStart" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="regEnd">Registration End</Label>
                                    <Input id="regEnd" type="date" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setIsCreateOpen(false)}>Create Event</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{events.length}</p>
                                <p className="text-sm text-muted-foreground">Total Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.bookedSlots, 0)}</p>
                                <p className="text-sm text-muted-foreground">Total Bookings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <IndianRupee className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">₹{(events.reduce((sum, e) => sum + (e.bookedSlots * e.price), 0) / 100000).toFixed(1)}L</p>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{events.filter(e => e.status === "active").length}</p>
                                <p className="text-sm text-muted-foreground">Active Events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Events List */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>All Events</CardTitle>
                            <CardDescription>Manage and monitor all events</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Search events..." className="pl-9 w-64" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                        <TabsList>
                            <TabsTrigger value="all">All Events</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                        <TabsContent value={selectedTab} className="mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Event</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Venue</TableHead>
                                        <TableHead>Slots</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEvents.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{event.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span className="text-xs">{event.time}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{event.venue}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-muted rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full"
                                                            style={{ width: `${(event.bookedSlots / event.totalSlots) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm">{event.bookedSlots}/{event.totalSlots}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">₹{event.price.toLocaleString()}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        event.status === "active"
                                                            ? "default"
                                                            : event.status === "upcoming"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {event.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Event
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Users className="mr-2 h-4 w-4" />
                                                            View Registrations
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Event
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}