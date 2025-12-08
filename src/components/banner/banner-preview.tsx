import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { getLinkFromJson } from '@/lib/utils';

// --- 1. Nested Component: The Banner Content ---
// This component is displayed inside both the Desktop and Mobile frames.
// It uses props to adjust its appearance based on the device context.
type BannerComponentProps = { isMobile: boolean; title?: string; content?: string; image?: string | File | Record<string, any> | null };
const BannerComponent: React.FC<BannerComponentProps> = ({ isMobile, title, content, image }) => {
  const textSize = isMobile ? 'text-sm' : 'text-xl';
  const padding = isMobile ? 'p-2' : 'p-3';
  const widthClass = isMobile ? 'w-full' : 'w-3/4 lg:w-full';

  const [objectUrl, setObjectUrl] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    let url: string | undefined;
    if (!image) {
      setObjectUrl(undefined);
      return;
    }
    if (typeof image === 'string') {
      setObjectUrl(image);
      return;
    }
    if (image instanceof File) {
      url = URL.createObjectURL(image);
      setObjectUrl(url);
      return;
    }
    if (typeof image === 'object') {
      // Common cases: Cloudinary JSON split into chars (getLinkFromJson) OR object with `url`/`secure_url` props
      try {
        const objAny: any = image;
        if (objAny?.secure_url) {
          setObjectUrl(objAny.secure_url);
          return;
        }
        if (objAny?.url) {
          setObjectUrl(objAny.url);
          return;
        }
        // fallback to reconstructing via getLinkFromJson (keeps existing behavior)
        const link = getLinkFromJson(objAny);
        if (link) {
          setObjectUrl(link);
          return;
        }
      } catch (err) {
        // ignore
      }
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image]);

  const displayTitle = title && title.trim().length ? title : (isMobile ? 'Mobile Optimized!' : 'Full Desktop Experience');
  const displayContent = content && content.trim().length ? content : 'This banner dynamically adjusts its layout to ensure the best viewing experience, whether on a large monitor or a compact mobile screen.';

  return (
    <div className={`bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl ${padding} mx-auto ${widthClass} transition-all duration-300`}>
      {objectUrl && (
        <img src={objectUrl} alt="preview" className="w-full h-36 object-cover rounded-md mb-3" />
      )}
      <h2 className={`font-bold text-gray-800 ${textSize} md:text-lg`}>
        {displayTitle}
      </h2>
      <p className="text-gray-600 text-xs">
        {displayContent}
      </p>
      {/* <button 
        className="mt-4 w-full md:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md"
      >
        Learn More
      </button> */}
    </div>
  );
};

// --- 2. Device Mockups (Desktop and Mobile) ---
type DeviceMockupProps = { children?: React.ReactNode };
const DesktopMockup: React.FC<DeviceMockupProps> = ({ children }) => (
  <div className="flex flex-col items-center">
    {/* Monitor Frame */}
    <div className="relative w-full max-w-4xl h-56 lg:h-72 bg-gray-900 border-[5px] border-gray-700 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Screen Area (Content is placed here) */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full p-4 flex items-center justify-center">
        {children}
      </div>
      {/* Webcam Placeholder (Optional detail) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
    </div>

    {/* Stand */}
    <div className="w-1/3 h-3 bg-gray-700 rounded-t-lg mt-1"></div>
    <div className="w-1/2 h-2 bg-gray-800 rounded-b-lg"></div>
  </div>
);

const MobileMockup: React.FC<DeviceMockupProps> = ({ children }) => (
  <div className="flex justify-center">
    {/* Mobile Frame (iPhone-like aesthetic) */}
    <div className="relative w-64 h-[450px] bg-black border-4 border-gray-800 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.7)] overflow-hidden">
      {/* Screen Area (Content is placed here) */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-full w-full p-3 flex items-center justify-center">
        {children}
      </div>
      {/* Speaker and Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-lg">
        <div className="w-8 h-1 bg-gray-600 mx-auto mt-1 rounded"></div>
      </div>
      {/* Home Indicator line at bottom */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-700 rounded-full"></div>
    </div>
  </div>
);


// --- 3. Main Application Component ---
type BannerPreviewProps = { title?: string; content?: string; images?: any[] };
const BannerPreview: React.FC<BannerPreviewProps> = ({ title, content, images }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop'); // 'desktop' or 'mobile'

  const isDesktop = viewMode === 'desktop';
  const isMobile = viewMode === 'mobile';

  type ToggleButtonProps = {
    mode: 'desktop' | 'mobile';
    icon: React.ElementType;
  };
  const ToggleButton: React.FC<ToggleButtonProps> = ({ mode, icon: Icon }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`
        flex items-center px-5 py-3 rounded-full font-semibold transition-all duration-300 ease-in-out
        ${viewMode === mode 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      
    </button>
  );

  return (
    <div className="w-full px-4 md:px-6 font-sans antialiased flex flex-col items-center">
      
      {/* Header and Toggle */}
      <div className="text-center">
        
        {/* Toggle Controls */}
        <div className="flex justify-center space-x-3 p-1 bg-white rounded-full shadow-xl ring-1 ring-gray-100">
          <ToggleButton 
            mode="desktop" 
            icon={Monitor}
          />
          <ToggleButton 
            mode="mobile" 
            icon={Smartphone} 
          />
        </div>
      </div>
      
      {/* Device Preview Area */}
      <div className="w-full py-6">
        <div className="max-w-6xl mx-auto flex justify-center">
          
          {/* Display Desktop Mockup */}
          {isDesktop && (
            <div className="transition-opacity duration-700 ease-in-out w-full opacity-100">
              <DesktopMockup>
                <BannerComponent isMobile={false} title={title} content={content} image={images?.[0] ?? null} />
              </DesktopMockup>
            </div>
          )}

          {/* Display Mobile Mockup */}
          {isMobile && (
            <div className="transition-opacity duration-700 ease-in-out opacity-100">
              <MobileMockup>
                <BannerComponent isMobile={true} title={title} content={content} image={images?.[0] ?? null} />
              </MobileMockup>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default BannerPreview;