/**
 * 补遗：读数区里带插值的短句，以及公式内部夹的中文。
 *
 * 公式那几条要连 LaTeX 一起翻——`\text{干涉项消失}` 里的中文在英文版里
 * 必须变成 `\text{interference term gone}`，否则英文页面会冒出一句中文。
 */
export const DICT_EXTRA: Record<string, string> = {
  ' / 解析 {0}': ' / analytic {0}',
  'E < V₀（经典禁止）': 'E < V₀ (classically forbidden)',
  'I(y) = |\\psi_1|^2 + |\\psi_2|^2 \\quad(\\text{干涉项消失})':
    'I(y) = |\\psi_1|^2 + |\\psi_2|^2 \\quad(\\text{interference term gone})',
  '\\quad(\\text{各项还要乘 } \\ee^{-\\ii E_n t/\\hbar})':
    '\\quad(\\text{each term also carries } \\ee^{-\\ii E_n t/\\hbar})',
  '|\\braket{\\pm_z}{\\pm_z}|^2 = 1 \\ \\text{或}\\ 0':
    '|\\braket{\\pm_z}{\\pm_z}|^2 = 1 \\ \\text{or}\\ 0',
  'ΔxΔp ≈ {0}（下限 0.5）': 'ΔxΔp ≈ {0} (lower bound 0.5)',
  '　定态': ' · stationary',
  '上一次测量：{0}': 'last outcome: {0}',
  '上次测得 x = {0}': 'last measured x = {0}',
  '两个量子数相同。费米子模式下整个波函数会恒等于零——这就是泡利不相容，它不是外加的禁令，而是反对称化的算术结果。':
    'The two quantum numbers are equal. In the fermion case the whole wavefunction vanishes identically — that is Pauli exclusion, not an extra rule but the arithmetic of antisymmetrisation.',
  束缚能级: 'Bound levels',
  '样本 {0}': 'samples {0}',
  '解析值 {0}（误差 {1}%）': 'analytic {0} (error {1}%)',
  '解析式预言还有一条能级，但它弱束缚到尾巴远超出计算窗口，数值上被硬边界推成了正能量。这不是 bug，而是「临界束缚态」的真实特征。':
    'The analytic formula predicts one more level, but it is bound so weakly that its tail runs far outside the computational window, and the hard boundary pushes it up to positive energy. This is not a bug — it is what a marginally bound state genuinely looks like.',
}
