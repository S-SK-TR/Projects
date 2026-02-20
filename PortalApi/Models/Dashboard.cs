using System.ComponentModel.DataAnnotations;

namespace PortalApi.Models;

public class Dashboard
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// JSON serialized GridStack layout configuration
    /// </summary>
    public string LayoutConfig { get; set; } = "[]";

    /// <summary>
    /// Auto-refresh interval in seconds (0 = disabled)
    /// </summary>
    public int RefreshIntervalSeconds { get; set; } = 0;

    public int CreatedByUserId { get; set; }

    public bool IsDefault { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
