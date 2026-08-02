import type { CheckFamily } from './scan-depth'
import type { PostureResult } from './posture-scan'
import type { Target } from './target-url'

/** Puerto del escaner de exposicion. La infraestructura hace las peticiones. */
export interface PostureScanner {
  scan(target: Target, families: readonly CheckFamily[]): Promise<PostureResult>
}
