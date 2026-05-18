import Navbar from "@/components/Navbar";
import DynamicBallroomBackground from "@/components/DynamicBallroomBackground";
import SectionHeading from "@/components/SectionHeading";

const blocks = [
  { icon: "✦", title: "视觉牌面", desc: "每一张牌都以细腻的图像和象征元素呈现，帮助你进入更专注的观看状态。" },
  { icon: "☽", title: "安静抽牌", desc: "通过洗牌、抽牌与翻牌的过程，让你有一个短暂的停顿，重新感受自己的问题。" },
  { icon: "⊕", title: "自我觉察", desc: "牌面解读不替你做决定，而是帮助你从另一个角度理解当下。" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <DynamicBallroomBackground primaryImage="/design-assets/ballroom-night.png" mode="night" intensity="soft" />
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-8 flex flex-col items-center justify-center" style={{ background: "transparent" }}>
        <div className="max-w-3xl mx-auto w-full relative z-10">
          <SectionHeading title="关于 ROYAL ARCANA" />

          <p className="text-sm sm:text-base leading-8 text-center mb-12 max-w-xl mx-auto" style={{ fontFamily: "EB Garamond, serif", color: "#6F5A3E" }}>
            ROYAL ARCANA 是一个以塔罗牌为媒介的自我觉察网页。
            它并不是为了预测一个确定的未来，也不是为了给出唯一正确的答案。
            它更像是一面安静的镜子：通过图像、关键词和文字，帮助你重新看见自己的状态、情绪和选择。
            在不确定的时候，人很容易急着寻找答案。但有时候，我们真正需要的不是马上得到结论，
            而是先把问题看清楚，把感受放回心里，再慢慢找回行动的力量。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {blocks.map((block, i) => (
              <div key={i} className="p-6 sm:p-8 text-center rounded-[28px] transition-all duration-300"
                style={{ background: "rgba(255,249,239,0.6)", border: "1px solid rgba(199,165,111,0.22)", boxShadow: "0 10px 35px rgba(111,90,62,0.06)" }}>
                <div className="text-2xl mb-4" style={{ color: "#C7A56F" }}>{block.icon}</div>
                <h3 className="text-sm tracking-[0.12em] mb-3" style={{ fontFamily: "Cinzel, serif", color: "#4A3A2A", fontWeight: 600 }}>{block.title}</h3>
                <p className="text-xs sm:text-sm leading-7" style={{ fontFamily: "EB Garamond, serif", color: "#8A7760" }}>{block.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
