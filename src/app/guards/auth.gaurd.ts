import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from  '../servicies/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true; // اجازه عبور
  } else {
    // فقط مسیر را برگردان، خود Angular هدایت را انجام می‌دهد
    // یا می توانید اینجا از router.parseUrl('/login') استفاده کنید
    // ولی معمولا بهتر است فقط false برگردانید و اجازه دهید Angular defaultUrlSerializer استفاده کند
    // یا اگر مطمئنید که همیشه باید به login برود:
    return router.createUrlTree(['/login']);
    // return false; // این هم جواب می‌دهد ولی createUrlTree صریح‌تر است
  }
};
