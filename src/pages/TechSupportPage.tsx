import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faLaptop, faCheck, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

const TechSupportPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [issue, setIssue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(false);

  // Generate calendar days for current month
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    // First day of calendar (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) { // 6 weeks
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today && !isToday;
      
      // Simulate availability (in real app, this would come from API)
      const availability = Math.random();
      let availabilityStatus = 'available';
      if (availability < 0.3) availabilityStatus = 'unavailable';
      else if (availability < 0.6) availabilityStatus = 'limited';
      
      days.push({
        date: new Date(date),
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        isCurrentMonth,
        isToday,
        isPast,
        availability: availabilityStatus,
        formattedDate: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    setCalendarDays(days);
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Time slots with availability
  const timeSlots = [
    { time: '9:00 AM', duration: '30 min', availability: 'available' },
    { time: '9:30 AM', duration: '30 min', availability: 'available' },
    { time: '10:00 AM', duration: '30 min', availability: 'limited' },
    { time: '10:30 AM', duration: '30 min', availability: 'available' },
    { time: '11:00 AM', duration: '30 min', availability: 'available' },
    { time: '11:30 AM', duration: '30 min', availability: 'unavailable' },
    { time: '12:00 PM', duration: '30 min', availability: 'available' },
    { time: '12:30 PM', duration: '30 min', availability: 'available' },
    { time: '1:00 PM', duration: '30 min', availability: 'limited' },
    { time: '1:30 PM', duration: '30 min', availability: 'available' },
    { time: '2:00 PM', duration: '30 min', availability: 'available' },
    { time: '2:30 PM', duration: '30 min', availability: 'available' },
    { time: '3:00 PM', duration: '30 min', availability: 'unavailable' },
    { time: '3:30 PM', duration: '30 min', availability: 'available' },
    { time: '4:00 PM', duration: '30 min', availability: 'available' },
    { time: '4:30 PM', duration: '30 min', availability: 'limited' },
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: any) => {
    if (day.isPast || day.availability === 'unavailable') return;
    setSelectedDate(day.formattedDate);
    setShowTimeSlots(true);
  };

  const handleTimeSelect = (timeSlot: any) => {
    if (timeSlot.availability === 'unavailable') return;
    setSelectedTime(timeSlot.time);
  };

  const handleBackToCalendar = () => {
    setShowTimeSlots(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const handleNewBooking = () => {
    setSelectedDate('');
    setSelectedTime('');
    setName('');
    setEmail('');
    setIssue('');
    setIsSubmitted(false);
    setShowTimeSlots(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-950">
        <section className="relative overflow-hidden py-10 md:py-16">
          <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
          <div className="container-narrow relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="card-glow p-8 md:p-12 max-w-2xl mx-auto">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center text-3xl text-white mx-auto mb-6">
                  <FontAwesomeIcon icon={faCheck} />
                </div>
                <h1 className="heading-1 mb-4">Support Session Booked!</h1>
                <p className="body-large mb-8">
                  We'll contact you soon with meeting details.
                </p>
                
                <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white font-medium">{email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    className="btn btn-primary"
                    onClick={handleNewBooking}
                  >
                    Book Another Session
                  </button>
                  <a href="/contact" className="btn btn-outline">
                    Contact Support
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-6">
              Tech Support
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Book a 30-minute support session with our experts for focused troubleshooting and guidance.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">30</div>
                <div className="text-gray-400">Minute Sessions</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">24/7</div>
                <div className="text-gray-400">Availability</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">4.9<FontAwesomeIcon icon={faStar} /></div>
                <div className="text-gray-400">Support Rating</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">Free</div>
                <div className="text-gray-400">Basic Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="section">
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calendar & Time Selection */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Calendar */}
              <div className="card-glow p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {currentMonth.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </h2>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={handlePrevMonth}
                    >
                      ←
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={handleNextMonth}
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {weekdays.map((day) => (
                    <div key={day} className="text-center text-gray-400 text-sm font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const isSelected = selectedDate === day.formattedDate;
                    const isDisabled = day.isPast || day.availability === 'unavailable';
                    
                    return (
                      <motion.button
                        key={index}
                        type="button"
                        whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                        className={`relative h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                            : isDisabled
                            ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                            : day.isToday
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : day.isCurrentMonth
                            ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                            : 'bg-gray-900/30 text-gray-500'
                        }`}
                        onClick={() => handleDateSelect(day)}
                        disabled={isDisabled}
                      >
                        <span className="text-sm font-medium">{day.day}</span>
                        {!day.isPast && day.availability !== 'available' && (
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                            day.availability === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {showTimeSlots && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Available Time Slots</h3>
                      <p className="text-gray-400">{selectedDate}</p>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={handleBackToCalendar}
                    >
                      ← Back
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {timeSlots.map((slot, index) => {
                      const isSelected = selectedTime === slot.time;
                      const isDisabled = slot.availability === 'unavailable';
                      
                      return (
                        <motion.button
                          key={index}
                          type="button"
                          whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                          whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent'
                              : isDisabled
                              ? 'bg-gray-800/30 border-gray-700/50 text-gray-600 cursor-not-allowed'
                              : slot.availability === 'limited'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                              : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                          }`}
                          onClick={() => handleTimeSelect(slot)}
                          disabled={isDisabled}
                        >
                          <div className="text-lg font-semibold">{slot.time}</div>
                          <div className="text-sm opacity-75">{slot.duration}</div>
                          {slot.availability !== 'available' && (
                            <div className="text-xs mt-1">
                              {slot.availability === 'limited' ? 'Limited' : 'Unavailable'}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Customer Details & Booking Summary */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <form onSubmit={handleSubmit}>
                {/* Customer Details */}
                <div className="card-glow p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Your Details</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input w-full"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input w-full"
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="issue" className="block text-sm font-medium text-gray-300 mb-2">
                        Issue Description (Optional)
                      </label>
                      <textarea
                        id="issue"
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        className="input w-full min-h-[120px]"
                        placeholder="Briefly describe your issue..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Summary */}
                <div className="card p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Booking Summary</h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Session Type:</span>
                      <span className="text-white font-medium">30-Minute Support</span>
                    </div>
                    
                    {selectedDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-white font-medium">{selectedDate}</span>
                      </div>
                    )}
                    
                    {selectedTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white font-medium">{selectedTime}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-medium">30 minutes</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Support Type:</span>
                      <span className="text-white font-medium">Remote Assistance</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-800/50 pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total</span>
                      <span className="text-2xl font-bold text-gradient-neon">$0</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-full py-4 text-lg"
                  disabled={!selectedDate || !selectedTime || !name || !email || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Booking...
                    </>
                  ) : (
                    'Book Support Session'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Support Features */}
      <section className="py-10 bg-gray-900/30">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Why Choose Our Tech Support?</h2>
            <p className="body-large max-w-3xl mx-auto">
              Professional support for all your gaming PC needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                ⏰
              </div>
              <h3 className="text-xl font-bold text-white mb-4">30-Minute Sessions</h3>
              <p className="text-gray-400">Focused troubleshooting and guidance for quick resolution</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                <FontAwesomeIcon icon={faLaptop} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Remote Support</h3>
              <p className="text-gray-400">Screen sharing and remote assistance for hands-on help</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Email Confirmation</h3>
              <p className="text-gray-400">Meeting link and details sent before your session</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Need Immediate Help?</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              Our live chat support is available 24/7 for urgent issues. 
              For complex troubleshooting, book a dedicated session with our experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn btn-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Live Chat Support
              </a>
              <a href="/faq" className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Browse FAQs
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechSupportPage;
