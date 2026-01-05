using Microsoft.EntityFrameworkCore;

namespace SensorApi.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
        public DbSet<User> Users { get; set; } 


        public DbSet<Device> Devices { get; set; }
        public DbSet<SensorData> SensorDataEntries { get; set; }
        public DbSet<UserDevice> UserDevices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Cấu hình bảng User
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users_table"); // Đặt tên bảng là users_table
            });

            modelBuilder.Entity<Device>(entity =>
            {
                entity.ToTable("devices_table"); 

            });

            modelBuilder.Entity<SensorData>(entity => {
                entity.ToTable("sensor_data_table");
                entity.Property(e => e.DeviceId).HasColumnName("device_id");
                entity.HasOne(e => e.Device).WithMany().HasForeignKey(e => e.DeviceId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<UserDevice>(entity => {
                entity.ToTable("user_devices_table");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Username).HasColumnName("username");
                entity.Property(e => e.FcmToken).HasColumnName("fcm_token");
                entity.Property(e => e.LastUpdated).HasColumnName("last_updated");

            });
        }
    }
}