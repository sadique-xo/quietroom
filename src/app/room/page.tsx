export default function QuietRoomPage() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sanctuary-lavender/30 via-sanctuary-white to-sanctuary-navy/20">
      {/* Close Button */}
      <button className="absolute top-8 left-8 z-overlay glass-button p-3 rounded-full">
        <svg className="w-6 h-6 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Breathing Circle */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="relative mb-12">
            <div className="breathing w-32 h-32 mx-auto rounded-full glass border-2 border-sanctuary-lavender/50"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-body-large text-sanctuary-navy font-medium">Breathe</span>
            </div>
          </div>
          
          {/* Timer Display */}
          <div className="glass p-6 mb-8">
            <div className="text-display-large text-sanctuary-navy font-bold mb-2">5:00</div>
            <p className="text-body-medium text-sanctuary-sage">Focus on your breath</p>
          </div>

          {/* Control Panel */}
          <div className="glass p-4">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button className="glass-button px-4 py-2 text-body-medium text-sanctuary-sage">5 min</button>
              <button className="glass-button px-4 py-2 text-body-medium text-sanctuary-navy font-medium bg-sanctuary-lavender/20">10 min</button>
              <button className="glass-button px-4 py-2 text-body-medium text-sanctuary-sage">15 min</button>
            </div>
            
            <div className="flex items-center justify-center space-x-6">
              <button className="glass-button p-4 rounded-full">
                <svg className="w-6 h-6 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5.5c-3.3 0-6 2.7-6 6v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6c0-3.3-2.7-6-6-6z" />
                </svg>
              </button>
              <button className="glass-button p-6 rounded-full bg-sanctuary-lavender/20">
                <svg className="w-8 h-8 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5.5c-3.3 0-6 2.7-6 6v6c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-6c0-3.3-2.7-6-6-6z" />
                </svg>
              </button>
              <button className="glass-button p-4 rounded-full">
                <svg className="w-6 h-6 text-sanctuary-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 