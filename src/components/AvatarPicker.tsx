import React, { useRef, useState } from "react";
import Mascot from "./Mascot";

export interface PresetAvatar {
  id: string;
  name: string;
  badge: string;
  bg: string;
  border: string;
  type: "mascot" | "emoji";
  emoji?: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: "mascot-orange",
    name: "TaSched Mascot",
    badge: "OFFICIAL",
    bg: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
    border: "#FB923C",
    type: "mascot",
  },
  {
    id: "scholar",
    name: "Graduate Scholar",
    badge: "ACADEMIC",
    bg: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
    border: "#3B82F6",
    type: "emoji",
    emoji: "🎓",
  },
  {
    id: "techie",
    name: "Code Wizard",
    badge: "TECH",
    bg: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
    border: "#10B981",
    type: "emoji",
    emoji: "💻",
  },
  {
    id: "professor",
    name: "Professor",
    badge: "FACULTY",
    bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)",
    border: "#8B5CF6",
    type: "emoji",
    emoji: "👩‍🏫",
  },
  {
    id: "artist",
    name: "Creative Mind",
    badge: "ARTS",
    bg: "linear-gradient(135deg, #FDF2F8, #FCE7F3)",
    border: "#EC4899",
    type: "emoji",
    emoji: "🎨",
  },
  {
    id: "scientist",
    name: "Lab Scientist",
    badge: "SCIENCE",
    bg: "linear-gradient(135deg, #F0FDFA, #CCFBF1)",
    border: "#14B8A6",
    type: "emoji",
    emoji: "🔬",
  },
  {
    id: "bookworm",
    name: "Bookworm",
    badge: "STUDY",
    bg: "linear-gradient(135deg, #FEFCE8, #FEF08A)",
    border: "#EAB308",
    type: "emoji",
    emoji: "📚",
  },
  {
    id: "cat",
    name: "Cool Cat",
    badge: "CHILL",
    bg: "linear-gradient(135deg, #FFF1F2, #FFE4E6)",
    border: "#F43F5E",
    type: "emoji",
    emoji: "🐱",
  },
  {
    id: "achiever",
    name: "Star Achiever",
    badge: "GOALS",
    bg: "linear-gradient(135deg, #FFFBEB, #FDE68A)",
    border: "#F59E0B",
    type: "emoji",
    emoji: "🌟",
  },
  {
    id: "athlete",
    name: "Energy Spark",
    badge: "ACTIVE",
    bg: "linear-gradient(135deg, #F8FAFC, #E2E8F0)",
    border: "#64748B",
    type: "emoji",
    emoji: "⚡",
  },
];

export interface AvatarProps {
  avatar?: string;
  role?: string;
  userName?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
  showEditBadge?: boolean;
}

function getInitials(name?: string, role = "student") {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  return role === "student" ? "ST" : "IN";
}

/**
 * Universal Avatar display component
 * Supports custom uploaded base64 photos, preset avatars, and default initials.
 */
export function UserAvatar({
  avatar = "mascot-orange",
  role = "student",
  userName = "",
  size = 40,
  className = "",
  onClick,
  showEditBadge = false,
}: AvatarProps) {
  const isCustomPhoto = avatar.startsWith("data:image/") || avatar.startsWith("http");
  const preset = PRESET_AVATARS.find((p) => p.id === avatar);

  return (
    <div
      className={`user-avatar-container ${onClick ? "is-clickable" : ""} ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="User Avatar"
    >
      {isCustomPhoto ? (
        <img
          src={avatar}
          alt="User Profile"
          className="user-avatar-img"
          style={{ width: size, height: size }}
        />
      ) : preset?.type === "mascot" ? (
        <div
          className="user-avatar-mascot-wrap"
          style={{
            background: preset.bg,
            border: `2px solid ${preset.border}`,
            width: size,
            height: size,
          }}
        >
          <Mascot pose="peeking-top" size={size * 0.9} interactive={false} />
        </div>
      ) : preset?.type === "emoji" ? (
        <div
          className="user-avatar-emoji-wrap"
          style={{
            background: preset.bg,
            borderColor: preset.border,
            width: size,
            height: size,
            fontSize: size * 0.52,
          }}
        >
          {preset.emoji}
        </div>
      ) : (
        <span
          className="user-avatar-fallback"
          style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
          {getInitials(userName, role)}
        </span>
      )}

      {showEditBadge && (
        <span className="user-avatar-edit-badge" title="Change Avatar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </span>
      )}
    </div>
  );
}

/**
 * Avatar Picker Modal Sheet
 * Allows choosing from preset avatars or uploading a custom photo.
 */
export function AvatarPickerModal({
  currentAvatar,
  role = "student",
  userName = "",
  onSave,
  onClose,
}: {
  currentAvatar: string;
  role?: string;
  userName?: string;
  onSave: (avatarIdOrDataUrl: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>(currentAvatar || "mascot-orange");
  const [previewError, setPreviewError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPreviewError("Please choose an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPreviewError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelected(reader.result);
        setPreviewError("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApply = () => {
    onSave(selected);
    onClose();
  };

  const isCustomPhoto = selected.startsWith("data:image/") || selected.startsWith("http");

  return (
    <div className="sheet-overlay avatar-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="avatar-picker-modal">
        <div className="sheet-handle" />

        <div className="sheet-header">
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
          <div>
            <p>CUSTOMIZE PROFILE</p>
            <h2>Choose your avatar</h2>
          </div>
          <span />
        </div>

        <div className="avatar-modal-body">
          {/* Current Live Preview Card */}
          <div className="avatar-preview-card">
            <div className="avatar-preview-glow" />
            <UserAvatar avatar={selected} role={role} userName={userName} size={84} />
            <div className="avatar-preview-meta">
              <strong>
                {isCustomPhoto ? "Custom Uploaded Photo" : PRESET_AVATARS.find((p) => p.id === selected)?.name || "Default Avatar"}
              </strong>
              <span>
                {isCustomPhoto ? "Personal profile image" : "Preset illustrated avatar"}
              </span>
            </div>
            {isCustomPhoto && (
              <button
                type="button"
                className="avatar-reset-btn"
                onClick={() => setSelected("mascot-orange")}
                title="Reset to Mascot avatar"
              >
                Reset to Mascot
              </button>
            )}
          </div>

          {/* Photo Upload Section */}
          <div className="avatar-upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="visually-hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span><strong>Upload your own photo</strong><small>PNG, JPG or WebP from your device</small></span>
              <b>Choose photo</b>
            </button>
            {previewError && <p className="inline-error" style={{ margin: "6px 0 0" }}>{previewError}</p>}
          </div>

          <div className="avatar-divider">
            <span />
            <p>OR PICK AN ILLUSTRATED AVATAR</p>
            <span />
          </div>

          {/* Preset Avatars Grid */}
          <div className="avatar-presets-grid">
            {PRESET_AVATARS.map((preset) => {
              const isSelected = selected === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`avatar-preset-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    setSelected(preset.id);
                    setPreviewError("");
                  }}
                >
                  <div className="avatar-preset-visual">
                    <UserAvatar avatar={preset.id} role={role} size={54} />
                    {isSelected && (
                      <span className="avatar-preset-check">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <strong className="avatar-preset-name">{preset.name}</strong>
                  <span className="avatar-preset-badge">{preset.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="avatar-modal-footer">
          <button type="button" className="outline-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={handleApply}>
            Save avatar
          </button>
        </div>
      </div>
    </div>
  );
}
export default UserAvatar;

