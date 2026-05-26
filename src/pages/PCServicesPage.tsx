import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faStar, faShieldHalved, faCheck, faWrench } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  popular: boolean;
  icon: string;
}

const PCServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/services`)
      .then(res => res.json())
      .then(data => {
        if (data.services) {
          const mapped = data.services.map((s: any) => ({
            id: s._id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.estimatedDuration || '1-2 hours',
            popular: s.isPopular || false,
            icon: <FontAwesomeIcon icon={faWrench} /> // fallback icon
          }));
          setServices(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Generate dates for the next 14 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (optional)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const formattedDate = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        
        dates.push({
          value: formattedDate,
          display: displayDate,
          available: true
        });
      }
    }
    
    return dates;
  };

  // Available time slots
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const dates = generateDates();

  const handleServiceSelect = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNextStep = () => {
    if (step === 1 && selectedServices.length > 0) {
      setStep(2);
    } else if (step === 2 && selectedDate && selectedTime) {
      setStep(3);
    } else if (step === 3 && name && email && address) {
      setStep(4);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const getSelectedServicesDetails = () => {
    return selectedServices.map(serviceId => {
      return services.find(s => s.id === serviceId);
    }).filter(Boolean) as Service[];
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const handleNewBooking = () => {
    setSelectedServices([]);
    setSelectedDate('');
    setSelectedTime('');
    setName('');
    setEmail('');
    setAddress('');
    setStep(1);
    setIsSubmitted(false);
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
                <h1 className="heading-1 mb-4">Service Booking Confirmed!</h1>
                <p className="body-large mb-8">
                  Your PC service appointment has been scheduled successfully.
                </p>
                
                <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Appointment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Services:</span>
                      <span className="text-white font-medium text-right">
                        {getSelectedServicesDetails().map(service => service.name).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-2xl font-bold text-gradient-neon">${calculateTotal()}</span>
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
                
                <p className="text-gray-400 mb-8">
                  A confirmation email with service details and payment instructions has been sent to {email}. 
                  Please bring your PC to our service center at the scheduled time.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    className="btn btn-primary"
                    onClick={handleNewBooking}
                  >
                    Book Another Service
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
              PC Services Booking
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Schedule professional PC services including diagnostics, upgrades, cleaning, and custom builds.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">8+</div>
                <div className="text-gray-400">Services</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">90</div>
                <div className="text-gray-400">Day Warranty</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">4.9<FontAwesomeIcon icon={faStar} /></div>
                <div className="text-gray-400">Service Rating</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">Same</div>
                <div className="text-gray-400">Day Service</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 bg-gray-900/50 border-y border-gray-800/50">
        <div className="container-narrow">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= stepNumber
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                    : 'bg-gray-800/50 text-gray-400'
                }`}>
                  {stepNumber}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium transition-all duration-300 ${
                    step >= stepNumber ? 'text-white' : 'text-gray-400'
                  }`}>
                    {stepNumber === 1 && 'Select Services'}
                    {stepNumber === 2 && 'Select Time'}
                    {stepNumber === 3 && 'Your Details'}
                    {stepNumber === 4 && 'Confirm'}
                  </div>
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-0.5 mx-4 transition-all duration-300 ${
                    step > stepNumber ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-gray-700/50'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Steps */}
      <section className="section">
        <div className="container-narrow">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">Select Services</h2>
                <p className="body-large max-w-3xl mx-auto">
                  Choose the PC services you need. You can select multiple services.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  
                  return (
                    <motion.div
                      key={service.id}
                      whileHover={{ y: -5 }}
                      className={`card cursor-pointer transition-all duration-300 ${
                        isSelected ? 'ring-2 ring-emerald-500' : ''
                      } ${service.popular ? 'border-emerald-500/30' : ''}`}
                      onClick={() => handleServiceSelect(service.id)}
                    >
                      <div className="p-6">
                        {service.popular && (
                          <div className="badge-accent mb-4">Popular</div>
                        )}
                        
                        <div className="text-3xl mb-4">{service.icon}</div>
                        
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-white">{service.name}</h3>
                          <div className="text-2xl font-bold text-gradient-neon">${service.price}</div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4">{service.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-gray-400 text-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {service.duration}
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-gray-800/50 text-gray-400'
                          }`}>
                            {isSelected ? 'Selected <FontAwesomeIcon icon={faCheck} />' : 'Select'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {selectedServices.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8 mb-8"
                >
                  <h3 className="text-xl font-bold text-white mb-6">Selected Services</h3>
                  <div className="space-y-4 mb-6">
                    {getSelectedServicesDetails().map((service) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <div>
                          <span className="text-white font-medium">{service.name}</span>
                          <span className="text-gray-400 text-sm ml-3">{service.duration}</span>
                        </div>
                        <span className="text-white font-bold">${service.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-800/50 pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Total</span>
                      <span className="text-2xl font-bold text-gradient-neon">${calculateTotal()}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-center">
                <button 
                  className="btn btn-primary px-8 py-4 text-lg"
                  onClick={handleNextStep}
                  disabled={selectedServices.length === 0}
                >
                  Continue to Time Selection
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">Select Date & Time</h2>
                <p className="body-large max-w-3xl mx-auto">
                  Choose a convenient time to bring your PC to our service center
                </p>
              </div>

              {/* Date Selection */}
              <div className="card p-8 mb-8">
                <h3 className="text-xl font-bold text-white mb-6">Select Date</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                  {dates.map((date) => {
                    const isSelected = selectedDate === date.value;
                    
                    return (
                      <motion.button
                        key={date.value}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent'
                            : !date.available
                            ? 'bg-gray-800/30 border-gray-700/50 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                        }`}
                        onClick={() => date.available && handleDateSelect(date.value)}
                        disabled={!date.available}
                      >
                        <div className="text-sm text-gray-400 mb-1">{date.display.split(' ')[0]}</div>
                        <div className="text-lg font-bold">{date.display.split(' ')[2]}</div>
                        <div className="text-sm text-gray-400">{date.display.split(' ')[1]}</div>
                        {!date.available && (
                          <div className="text-xs text-red-400 mt-1">Full</div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8 mb-8"
                >
                  <h3 className="text-xl font-bold text-white mb-6">Select Time</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      
                      return (
                        <motion.button
                          key={time}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent'
                              : 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                          }`}
                          onClick={() => handleTimeSelect(time)}
                        >
                          <div className="text-lg font-semibold">{time}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between">
                <button 
                  className="btn btn-outline px-8 py-4 text-lg"
                  onClick={handlePreviousStep}
                >
                  ← Back
                </button>
                <button 
                  className="btn btn-primary px-8 py-4 text-lg"
                  onClick={handleNextStep}
                  disabled={!selectedDate || !selectedTime}
                >
                  Continue to Your Details
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">Your Information</h2>
                <p className="body-large max-w-3xl mx-auto">
                  We'll use this to send your service confirmation and updates
                </p>
              </div>

              <div className="card p-8 mb-8">
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
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                      Service Center Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input w-full"
                      placeholder="123 Tech Street, City, State ZIP"
                      required
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      This is where you'll bring your PC for service
                    </p>
                  </div>

                  <div>
                    <label htmlFor="pc-details" className="block text-sm font-medium text-gray-300 mb-2">
                      PC Details (Optional)
                    </label>
                    <textarea
                      id="pc-details"
                      className="input w-full min-h-[120px]"
                      placeholder="Describe your PC (brand, model, specs) and any specific issues..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  className="btn btn-outline px-8 py-4 text-lg"
                  onClick={handlePreviousStep}
                >
                  ← Back
                </button>
                <button 
                  className="btn btn-primary px-8 py-4 text-lg"
                  onClick={handleNextStep}
                  disabled={!name || !email || !address}
                >
                  Continue to Confirmation
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">Confirm Your Service Booking</h2>
                <p className="body-large max-w-3xl mx-auto">
                  Please review all details before confirming your appointment
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Selected Services */}
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Selected Services</h3>
                  <div className="space-y-4">
                    {getSelectedServicesDetails().map((service) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <div>
                          <span className="text-white font-medium">{service.name}</span>
                          <span className="text-gray-400 text-sm ml-3">{service.duration}</span>
                        </div>
                        <span className="text-white font-bold">${service.price}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-800/50 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-white">Total</span>
                        <span className="text-2xl font-bold text-gradient-neon">${calculateTotal()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Appointment Details</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-400 text-sm">Date</div>
                      <div className="text-white font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Time</div>
                      <div className="text-white font-medium">{selectedTime}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Location</div>
                      <div className="text-white font-medium">{address}</div>
                    </div>
                  </div>
                </div>

                {/* Your Information */}
                <div className="card p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Your Information</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-400 text-sm">Name</div>
                      <div className="text-white font-medium">{name}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Email</div>
                      <div className="text-white font-medium">{email}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-8 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-blue-400">
                    <strong>Important:</strong> Payment will be collected when you bring your PC to our service center. 
                    Please arrive 15 minutes early for check-in. Bring any components you want installed.
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  className="btn btn-outline px-8 py-4 text-lg"
                  onClick={handlePreviousStep}
                >
                  ← Back
                </button>
                <button 
                  className="btn btn-primary px-8 py-4 text-lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Service Features */}
      <section className="py-10 bg-gray-900/30">
        <div className="container-narrow">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Why Choose Our PC Services?</h2>
            <p className="body-large max-w-3xl mx-auto">
              Professional service for all your gaming PC needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                <FontAwesomeIcon icon={faWrench} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Expert Technicians</h3>
              <p className="text-gray-400">Our certified technicians have years of experience with all PC brands and custom builds.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                <FontAwesomeIcon icon={faBox} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Parts & Components</h3>
              <p className="text-gray-400">We stock common replacement parts and can order specific components for you.</p>
            </div>

            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center text-2xl mx-auto mb-6">
                <FontAwesomeIcon icon={faShieldHalved} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">90-Day Warranty</h3>
              <p className="text-gray-400">All services come with a 90-day warranty on labor and installed components.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10">
        <div className="container-narrow">
          <div className="card-glow p-8 md:p-12 text-center">
            <h2 className="heading-2 mb-4">Ready to Book Your PC Service?</h2>
            <p className="body-large max-w-2xl mx-auto mb-8">
              Our expert technicians are ready to help with diagnostics, upgrades, cleaning, and custom builds. 
              Book your appointment today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="btn btn-primary"
                onClick={() => setStep(1)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Service Now
              </button>
              <a href="/contact" className="btn btn-outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Questions? Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PCServicesPage;

               