import Navbar from "@/components/Navbar";
import SectionHeading from "@/components/SectionHeading";

const blocks = [
  {
    title: "视觉牌面",
    desc: "每一张牌都以细腻的图像和象征元素呈现，帮助你进入更专注的观看状态。",
  },
  {
    title: "安静抽牌",
    desc: "通过洗牌、抽牌与翻牌的过程，让你有一个短暂的停顿，重新感受自己的问题。",
  },
  {
    title: "自我觉察",
    desc: "牌面解读不替你做决定，而是帮助你从另一个角度理解当下。",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div
        className="min-h-screen pt-20 pb-20 px-4 sm:px-8 flex flex-col items-center justify-center"
        style={{ background: "#0D1424" }}
      >
        <div className="max-w-3xl mx-auto w-full">
          <SectionHeading title="关于 ROYAL ARCANA" />

          {/* Main text */}
          <p
            className="text-sm sm:text-base leading-relaxed text-center mb-12 max-w-xl mx-auto"
            style={{
              fontFamily: "EB Garamond, serif",
              color: "rgba(244,231,207,0.65)",
            }}
          >
            ROYAL ARCANA 是一个以塔罗牌为媒介的自我觉察网页。
            它并不是为了预测一个确定的未来，也不是为了给出唯一正确的答案。
            它更像是一面安静的镜子：通过图像、关键词和文字，帮助你重新看见自己的状态、情绪和选择。
            在不确定的时候，人很容易急着寻找答案。但有时候，我们真正需要的不是马上得到结论，
            而是先把问题看清楚，把感受放回心里，再慢慢找回行动的力量。
          </p>

          {/* Three ornate blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {blocks.map((block, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 text-center"
                style={{
                  background: "rgba(200,169,107,0.02)",
                  border: "1px solid rgba(200,169,107,0.12)",
                }}
              >
                <div className="text-2xl mb-4" style={{ color: "#C8A96B" }}>
                  {i === 0 ? "✦" : i === 1 ? "☽" : "⊕"}
                </div>
                <h3
                  className="text-sm tracking-[0.15em] mb-3"
                  style={{
                    fontFamily: "Cinzel, serif",
                    color: "#C8A96B",
                  }}
                >
                  {block.title}
                </h3>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{
                    fontFamily: "EB Garamond, serif",
                    color: "rgba(184,188,198,0.5)",
                  }}
                >
                  {block.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
