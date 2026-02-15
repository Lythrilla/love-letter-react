import { useAppStore } from '../../store/useAppStore'
import { useRef, useEffect, useState, memo } from 'react'

const GlowEffect = memo(function GlowEffect({ active }: { active: boolean }) {
  if (!active) return null
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
        background: 'radial-gradient(circle at 50% 50%, rgba(255,182,193,0.15) 0%, transparent 50%)',
        animation: 'glowPulse 2.5s ease-in-out infinite',
      }}
    />
  )
})

export function LetterContent() {
  const setPhase = useAppStore((s) => s.setPhase)
  const resetCamera = useAppStore((s) => s.resetCamera)
  const confessionRef = useRef<HTMLParagraphElement>(null)
  const [showHearts, setShowHearts] = useState(false)
  
  // 检测“我爱你”句子出现
  useEffect(() => {
    const el = confessionRef.current
    if (!el) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowHearts(true)
        } else {
          setShowHearts(false)
        }
      },
      { threshold: 0.5 }
    )
    
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // 谢谢你来过
  return (
    <>
    <GlowEffect active={showHearts} />
    <div className="paper-content">
      <div className="tag">MEMORIES</div>

      <h1>至那个 <br />把回忆熬成星光的你</h1>

      <p>今天五点睡的觉，七点就醒了，手机的震动响了起来</p>
      <p>模糊的看了眼屏幕，是年级群</p>
      <p>被打扰了的觉，我便在难入睡了</p>
      <p>我的头脑还是像那天一般难受</p>
      <p>阳光洒在我流泪的脸上</p>
      <p>我只想将身躯掩埋于荒芜的沙漠</p>
      <p>血肉之上</p>
      <p>假面的告白</p>

      <p>
        凌晨三点的星光，像极了你眼里的光芒。<br />
        我盯着我们的聊天记录看了很久很久，<br />
        你说，开往家的大巴会按时发车<br />
        见字如面，我亲爱的X。
      </p>

      <div className="divider" />

      <p>
        我常想，我究竟要用多长时间来咀嚼生命的斑驳才能适应他的孤寂和雾霭。
        人生有太多感受是后知后觉的。
        你像是五月的青杏一般酸涩，又像是六月小雨一样绵密出现在我的生活里。
        缘分究竟是幸运还是诅咒。
      </p>

      <p>
        我试图让你从我的生活里消失。删掉了所有的联系方式，不再去我们在一起时常去的地方，不再听我们一起听过的歌。我以为只要闭上眼睛，世界就会安静下来，思念就会停止。
      </p>

      <p>
        可是我错了。
      </p>

      <p>
        当我第一百次点开QQ，点开微信，点开抖音，处处无你，却处处都是你。
      </p>

      <p>
        毕竟思念不是一阵风，吹过就散了。它是刺在骨头里的刺青，每一次呼吸都在提醒我：你曾经来过我的生命里，然后又悄无声息的离开。
      </p>

      <p className="quote">
        "时间不一定能治愈伤痛，反而在岁月的打磨下变得更加难以愈合"
      </p>

      <p>
        他们都说忘记就不会痛苦。<br />
        可时间从不曾赋予谁忘记的权力。<br />
        它只是让你学会了沉默。
      </p>

      <p>
        那些回忆不会消失，<br />
        它们只是安静地待在那里，<br />
        等着某一天被再次提起，被再次想起。<br />
        我太容易哭泣了...
      </p>

      <div className="divider" />

      <p>
        你知道吗，和你在一起的那些日子，是我人生中最亮眼最快乐的一段时光。从来都不廉价。
      </p>

      <div className="memory-list">
        <p>你会在我需要的时候，给予我默默的陪伴；</p>
        <p>你会在我无助的时候，偷偷给我点一份外卖送给我；</p>
        <p>你会在我心情不好的时候，悄悄的安慰我，给我扮各种丑逗我开心；</p>
        <p>你会在凌晨陪我打游戏，困得睁不开眼还强撑着说没事；</p>
        <p>你会在我犯错的时候，默默承受吸收我的错误，还总是安慰着我没事；</p>
        <p>你会在我说完蠢话后，笑着说"浩浩可爱"；</p>
        <p>你会永远握住我的手，给我勇气。</p>
      </div>

      <p>
        你让我忘了独自长大时受过的所有伤。你让我相信，原来我也是值得被爱的。
      </p>


      <div className="divider" />

      <p>
        可我太不懂事了。
      </p>

      <p>
        我把你的好当作理所当然，把你的包容当作软弱，把你的退让当作妥协。我总是在吵架的时候说最狠的话，在冷战的时候装作最不在乎的样子。我以为爱就是可以肆无忌惮，却忘了再深的感情也经不起一次次的消耗。
      </p>

      <p>
        我害怕幸福短暂，于是疯狂试探。<br />
        谢谢你的耐心和真心。<br />
        你的真诚善良，我细数，我珍重。
      </p>

      <p>
        我用刺扎伤了最爱我的人。
      </p>

      <p>
        对不起。我知道这三个字太轻，轻到弥补不了任何伤害。我真的很后悔，后悔没有早一点明白，后悔没有好好珍惜你。
      </p>

      <p>
        如果时间可以倒流，我想回到每一次吵架的时候，把那些伤人的话统统吞回去，伤人的事统统不发生。我想回到每一次你难过的时候，紧紧抱住你说"对不起，是我不好"。
      </p>

      <div className="divider" />

      <h2>那些还没完成的约定</h2>
      <p className="todo-intro">那个写满了我们愿望的清单，是否还能记起。</p>
      
      <div className="todo-list">
        <span className="todo-item done">一起去旅行 ✓</span>
        <span className="todo-item done">一起去海边 ✓</span>
        <span className="todo-item done">一起吃宵夜 ✓</span>
        <span className="todo-item done">一起玩游戏 ✓</span>
        <span className="todo-item done">一起合影 ✓</span>
        <span className="todo-item done">为对方录音 ✓</span>
        <span className="todo-item done">给对方准备惊喜 ✓</span>
        <span className="todo-item">一起去游乐园</span>
        <span className="todo-item">一起去海洋馆</span>
        <span className="todo-item">一起坐摩天轮</span>
        <span className="todo-item">一起看日出</span>
        <span className="todo-item">一起在雨中漫步</span>
        <span className="todo-item">一起跨年倒数</span>
        <span className="todo-item">一起堆雪人</span>
        <span className="todo-item">一起看烟花</span>
        <span className="todo-item">一起去看樱花</span>
        <span className="todo-item">一起露营看星星</span>
        <span className="todo-item">一起骑车夜游</span>
        <span className="todo-item">一起养一只猫</span>
        <span className="todo-item">一起做一顿饭</span>
        <span className="todo-item">一起读完一本书</span>
        <span className="todo-item">冬天给你暖手</span>
        <span className="todo-item">夏天给你扇扇子</span>
        <span className="todo-item">...</span>
        <span className="todo-item highlight-item">一起白头偕老</span>
      </div>
      
      <p className="todo-outro">
        这份清单，我想用一辈子的时间，和你一起划掉。
      </p>

      <div className="divider" />

      <p>
        X，我真的很庆幸遇见你。
      </p>

      <p>
        在遇见你之前，我以为幸福、被爱、被包容，这些词都离我很远很远。我习惯了一个人，习惯了把所有情绪藏在心里，习惯了假装什么都不在乎。
      </p>

      <p>
        是你，让我第一次感受到被人放在心上是什么感觉。
      </p>

      <p>
        你记得我随口说过的每一句话，你在我难过的时候默默陪着我，你从来不嫌弃我的任性和幼稚。你让我原本灰白的生活，透过了五颜六色的光。
      </p>

      <p className="quote">
        "爱情最动人的，不是初见时的惊艳，而是久处后的安心。是知道无论外面风雨多大，总有个人在等你回家。是哪怕看遍了世界的精彩，依然觉得身边的你，最可爱。"
      </p>

      <p>
        你就是那个让我安心的人。和你在一起的每一刻，我都能真切地感受到自己的存在，感受到活着的意义。我好想把时间调成0.5倍速，慢慢地、仔细地，感受和你在一起的每一秒。
      </p>

      <div className="divider" />

      <p>
        X，我知道我很笨，很多话说不出口。我知道我有很多毛病，一时半会改不掉。但我想告诉你——
      </p>

      <p className="highlight">
        这个世界上，除了你，谁都不重要。
      </p>

      <p>
        我不想再假装坚强，不想再逞能说无所谓。没有你的日子，我真的很难熬。每天醒来第一件事就是想你，睡前最后一件事还是想你。我像丢了魂一样，做什么都提不起劲。
      </p>

      <p>
        我承认，我离不开你。
      </p>

      <div className="divider" />

      <p className="quote">
        "爱情最动人的不是初见时的心动，<br />
        而是历经风雨后依然选择握紧彼此的手。"
      </p>

      <p>
        但只要是和你，再难的路我都愿意走。我会努力变得更好，会学着控制情绪，会好好说话不再伤害你。
      </p>

      <p>
        我会在你难过的时候第一时间出现，我会在你开心的时候比你还开心。我会记住你说过的每一句话，我会把你的喜好刻在心里。我会成为你最坚实的依靠，让你知道无论发生什么，身后永远有我。
      </p>

      <p>
        这次，轮到我来宠X
      </p>

      <p>
        我想象过很多次我们的未来：<br />
        一起买一间小房子，养一只猫，周末睡到自然醒；<br />
        吵架了也不冷战，抱着你说"我错了"；<br />
        老了以后，还能像现在这样，叫你一声"X"。
      </p>

      <p>
        我们还有那么多约定没有实现，那么多地方没有一起去过，那么多瞬间没有一起经历。
      </p>

      <p>
        人生苦短，我不想给自己留下遗憾。<br />
        能不能慢点忘记我呀<br />
        能不能每天晚上都给我打电话呀w<br />
        原来，渐行渐远的不只是时间
      </p>

      <p className="quote">
        "相遇即是上上签"
      </p>

      <div className="divider" />

      <p>
        写到这里，天快亮了。
      </p>

      <p>
        窗外的星星慢慢消失，淹没了那么多没说出口的话。
      </p>

      <p>
        写下这些字的每一秒，我都在想你。
      </p>

      <p>
        剩下的，就交给命运吧。
      </p>

      <p>
        我爱你。从第一眼见到你的那天起，到现在，到以后，一直都是，我不想把你让给别人。
      </p>

      <p>
        如果有来生，我还想遇见你，像是苦情巨树那个约定。<br />
        这一次，我会更早一点告诉你：
      </p>

      <p className={`final-confession ${showHearts ? 'glowing' : ''}`} ref={confessionRef}>
        曾经有个人，笨拙地、用尽全力地爱过你。<br />这辈子，下辈子，都是。
      </p>

      <div className="divider" />

      <p>
        不是我非你不可，舍不得你，<br />
        只是我知道，这是我人生中最后为数不多的真心。
      </p>

      <p>
        失去和拥有都由不得我。<br />
        或许是我想要的太多，<br />
        又或许我从未得到过我想要的。
      </p>

      <p>
        其实我也没想明白，<br />
        那个让我频频回头的执念是什么。
      </p>

      <p className="quote">
        现在，我好像学会平静了
      </p>

      <div className="signature">
        <div className="signature-sub">当我的记忆变成流沙</div>
        <div className="signature-title">你还是岸边永远不褪色的画</div>
      </div>

      <div style={{ textAlign: 'center', margin: '4rem 0 2rem' }}>
        <button
          onClick={() => { resetCamera(); setPhase('ending') }}
          style={{
            padding: '0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.2em',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
        >
          继续 →
        </button>
      </div>

      <div 
        style={{
          textAlign: 'center',
          marginTop: '3rem',
          paddingBottom: '2rem',
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.2)',
          letterSpacing: '0.15em',
        }}
      >
        Made with ♥ by 浩浩
      </div>
    </div>
    </>
  )
}
