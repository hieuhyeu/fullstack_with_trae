<template>
  <footer class="bg-black text-white pt-12 pb-6">
    <div class="max-w-[1440px] mx-auto px-6 lg:px-16">
      <!-- Main footer grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
        <div>
          <h4 class="text-[12px] font-bold uppercase tracking-[0.12em] mb-4">Sản Phẩm</h4>
          <ul class="space-y-2.5">
            <li v-for="l in ['Giày', 'Áo', 'Quần', 'Phụ kiện', 'Bộ sưu tập']" :key="l">
              <a href="#" class="text-[12px] text-white/60 hover:text-white transition-colors">{{ l }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-[12px] font-bold uppercase tracking-[0.12em] mb-4">Thể Thao</h4>
          <ul class="space-y-2.5">
            <li v-for="l in ['Chạy bộ', 'Bóng đá', 'Training', 'Bơi lội', 'Outdoor']" :key="l">
              <a href="#" class="text-[12px] text-white/60 hover:text-white transition-colors">{{ l }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-[12px] font-bold uppercase tracking-[0.12em] mb-4">Hỗ Trợ</h4>
          <ul class="space-y-2.5">
            <li v-for="l in ['Trợ giúp', 'Theo dõi đơn hàng', 'Hướng dẫn size', 'Đổi trả hàng', 'Liên hệ']" :key="l">
              <a href="#" class="text-[12px] text-white/60 hover:text-white transition-colors">{{ l }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-[12px] font-bold uppercase tracking-[0.12em] mb-4">Công Ty</h4>
          <ul class="space-y-2.5">
            <li v-for="l in ['Về chúng tôi', 'Tuyển dụng', 'Báo chí', 'Nhà đầu tư', 'Bền vững']" :key="l">
              <a href="#" class="text-[12px] text-white/60 hover:text-white transition-colors">{{ l }}</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex flex-wrap gap-4">
          <a href="#" class="text-[11px] text-white/40 hover:text-white/70 transition-colors">Chính sách bảo mật</a>
          <a href="#" class="text-[11px] text-white/40 hover:text-white/70 transition-colors">Điều khoản sử dụng</a>
          <a href="#" class="text-[11px] text-white/40 hover:text-white/70 transition-colors">Cookie Settings</a>
        </div>
        <p class="text-[11px] text-white/30">© 2025 adidas Vietnam. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts"></script>
