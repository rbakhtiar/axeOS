
require "json"
require "fileutils"

module AxeOS

  class Settings

    DEFAULTS = {
      "theme" => "emerald",
      "accent" => "#35b88c",
      "font" => "Alegreya",
      "sound" => true,
      "animations" => true,
      "dock_position" => "bottom",
      "desktop_icons" => true
    }.freeze

    THEMES = {
      "emerald" => {
        "background" => "#071b16",
        "surface" => "#0c241d",
        "accent" => "#35b88c"
      },

      "midnight" => {
        "background" => "#080d19",
        "surface" => "#111c31",
        "accent" => "#7598d8"
      },

      "forest" => {
        "background" => "#101d12",
        "surface" => "#1c3320",
        "accent" => "#86ad70"
      }
    }.freeze

    def initialize(path = "axe_data/settings.json")
      @path = path
      FileUtils.mkdir_p(File.dirname(@path))
      @values = load_settings
    end

    def load_settings
      return DEFAULTS.dup unless File.exist?(@path)

      begin
        saved = JSON.parse(File.read(@path))
        DEFAULTS.merge(saved)
      rescue JSON::ParserError, SystemCallError
        DEFAULTS.dup
      end
    end

    def save
      temporary = "#{@path}.tmp"

      File.write(
        temporary,
        JSON.pretty_generate(@values)
      )

      File.rename(temporary, @path)
    end

    def get(key)
      @values[key.to_s]
    end

    def set(key, value)
      key = key.to_s

      raise ArgumentError, "Unknown setting" unless
        DEFAULTS.key?(key)

      @values[key] = value
      save
    end

    def set_theme(name)
      raise ArgumentError, "Unknown theme" unless
        THEMES.key?(name)

      @values["theme"] = name
      @values["accent"] = THEMES[name]["accent"]

      save
    end

    def theme
      THEMES[@values["theme"]] || THEMES["emerald"]
    end

    def reset
      @values = DEFAULTS.dup
      save
    end

    def all
      @values.dup
    end
  end

end

if __FILE__ == $PROGRAM_NAME
  settings = AxeOS::Settings.new

  puts "axeOS Ruby Configuration Engine"
  puts "Current theme: #{settings.get("theme")}"

  settings.set_theme("emerald")

  puts "\nCurrent configuration:"
  puts JSON.pretty_generate(settings.all)

  puts "\nTheme colors:"
  puts JSON.pretty_generate(settings.theme)
end
