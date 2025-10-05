import { Volume2 } from "lucide-react";
import { testIncidentAnnouncement } from "../lib/incidentAnnouncer";

/**
 * Test button to try the Gemini + ElevenLabs announcement system
 */
export function AnnouncementTestButton() {
  const handleTest = async () => {
    console.log("🧪 Testing announcement system...");
    try {
      await testIncidentAnnouncement();
    } catch (error) {
      console.error("Error testing announcement:", error);
      alert("Error testing announcement. Check console for details.");
    }
  };

  return (
    <button
      onClick={handleTest}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      title="Test voice announcement system"
    >
      <Volume2 className="w-5 h-5" />
      <span className="font-medium">Test Announcement</span>
    </button>
  );
}
