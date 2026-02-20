using System.ComponentModel.DataAnnotations;

namespace PortalApi.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "User"; // "Admin" or "User"

    public int? LastViewedDashboardId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
